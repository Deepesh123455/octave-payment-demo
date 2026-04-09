export type QuickExpenseNotification = {
  id: string;
  storeId: string;
  category: string;
  amount: number;
  description: string;
  status: string;
  createdAt: string;
};

const STORAGE_KEY = "octave_quick_expense_notifications";
const OPEN_EVENT = "octave:open-quick-expense";
const CHANGE_EVENT = "octave:quick-expense-change";

const isBrowser = typeof window !== "undefined";

export const getQuickExpenseNotifications = (): QuickExpenseNotification[] => {
  if (!isBrowser) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const persistQuickExpenseNotifications = (items: QuickExpenseNotification[]) => {
  if (!isBrowser) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: items }));
};

export const upsertQuickExpenseNotification = (expense: QuickExpenseNotification) => {
  const current = getQuickExpenseNotifications();
  if (current.some((item) => item.id === expense.id)) {
    return;
  }

  persistQuickExpenseNotifications([expense, ...current]);
};

export const removeQuickExpenseNotification = (id: string) => {
  const current = getQuickExpenseNotifications();
  persistQuickExpenseNotifications(current.filter((item) => item.id !== id));
};

export const subscribeToQuickExpenseNotifications = (
  callback: (items: QuickExpenseNotification[]) => void,
) => {
  if (!isBrowser) {
    return () => undefined;
  }

  const handleChange = (event: Event) => {
    const customEvent = event as CustomEvent<QuickExpenseNotification[]>;
    callback(customEvent.detail ?? getQuickExpenseNotifications());
  };

  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      callback(getQuickExpenseNotifications());
    }
  };

  window.addEventListener(CHANGE_EVENT, handleChange as EventListener);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(CHANGE_EVENT, handleChange as EventListener);
    window.removeEventListener("storage", handleStorage);
  };
};

export const openQuickExpenseFromNotification = (expense: QuickExpenseNotification) => {
  if (!isBrowser) {
    return;
  }

  window.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: expense }));
};

export const subscribeToQuickExpenseOpen = (
  callback: (expense: QuickExpenseNotification) => void,
) => {
  if (!isBrowser) {
    return () => undefined;
  }

  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<QuickExpenseNotification>;
    if (customEvent.detail) {
      callback(customEvent.detail);
    }
  };

  window.addEventListener(OPEN_EVENT, handler as EventListener);

  return () => {
    window.removeEventListener(OPEN_EVENT, handler as EventListener);
  };
};
