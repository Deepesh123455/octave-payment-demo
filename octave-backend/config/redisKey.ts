

export type RedisKeyType =
  
  | 'RATE_LIMIT_IP'         
  | 'RATE_LIMIT_LOGIN_IP'    
  | 'RATE_LIMIT_OTP_IP'      
  | 'RATE_LIMIT_TOTP_IP'     
  | 'SPEED_LIMIT_IP'        
 
  | 'SESSION'                
  | 'OTP_HASH'               
  | 'OTP_ATTEMPTS_IP'        
  | 'IP_BAN'                
  | 'ACCOUNT_LOCK'           
  | 'TOTP_LOCK' 
 | 'OTP_COOLDOWN'         
 
  | 'NOTIF_SENT';           
const PREFIXES: Record<RedisKeyType, string> = {
  RATE_LIMIT_IP:         'rl:api',
  RATE_LIMIT_LOGIN_IP:   'rl:login',
  RATE_LIMIT_OTP_IP:     'rl:otp_send',
  RATE_LIMIT_TOTP_IP:    'rl:totp',
  SPEED_LIMIT_IP:        'sl:throttle',
  SESSION:               'session',
  OTP_HASH:              'otp',
  OTP_ATTEMPTS_IP:       'auth:otp:attempts',
  IP_BAN:                'auth:ip:ban',
  ACCOUNT_LOCK:          'auth:lock',
  TOTP_LOCK:             'auth:totp:lock',
  NOTIF_SENT:            'notif:sent',
  OTP_COOLDOWN:          'auth:otp:cooldown',
};

/**
 * 
 *
 * @example
 *   
 */
export function generateRedisKey(type: RedisKeyType, identifier: string): string {
  if (!identifier || identifier.trim() === '') {
    throw new Error(`[redisKey] identifier must not be empty for key type: ${type}`);
  }
  return `${PREFIXES[type]}:${identifier}`;
}