import { useEffect, useState } from "react";
import type { OtpResponse, SessionResponse, SignInResponse, User } from "./types";
import { useForm } from "react-hook-form";
import { api } from "./api";

type Step = 'PHONE' | 'OTP';

interface IFormInput {
  phone: string;
  code: string;
}

export const Auth = () => {
  const [step, setStep] = useState<Step>('PHONE');
  const [user, setUser] = useState<User | null>(null);
  const [retryDelay, setRetryDelay] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<IFormInput>();
  const phoneValue = watch('phone');

  const checkSession = async () => {
    const token = localStorage.getItem('token');
    if(!token) {
      setIsInitializing(false);
      return;
    }

    try {
      const response = await api.get<SessionResponse>("/api/user/session");

      if(response.data.success) {
        setUser(response.data.user);
      } else {
        localStorage.removeItem('token');
      } 
    } catch (err) {
      console.error('Ошибка проверки сессии', err);
      localStorage.removeItem('token');
    } finally {
      setIsInitializing(false);
    }
  };
  useEffect(() => {
    checkSession();
  }, []);



  useEffect(() => {
    if(retryDelay <= 0) return; 
    const timer = setTimeout(() => setRetryDelay(retryDelay - 1000), 1000);
    return () => clearTimeout(timer);
  }, [retryDelay]);
  
  if (isInitializing) {
    return <div className="auth-card">Загрузка сессии...</div>
  }
  const onSendOtp = async (data: { phone: string }) =>{
    setIsLoading(true);
    try{
      const response = await api.post<OtpResponse>('/api/auth/otp', { phone: data.phone });
      if(response.data.success) {
        setStep('OTP');
        setRetryDelay(response.data.retryDelay);
      } else {
        alert(response.data.reason || 'Ошибка при отправке кода');
      }
    } catch (err) {
      alert('Ошибка сети');
    } finally {
      setIsLoading(false);
    }
  };

  const onSignIn = async (data: IFormInput) => {
    setIsLoading(true);
    try {
      const response = await api.post<SignInResponse>('/api/users/signin', {
        phone: data.phone,
        code: Number(data.code),
      });
      if(response.data.success) {
        localStorage.setItem('token', response.data.token);
        setUser(response.data.user);
      } else {
        alert(response.data.reason || "Неверный кол");
      }
    } catch (err) {
      alert("Ошибка авторизации");
    } finally {
      setIsLoading(false);
    }
  };

  if(user) {
    return (
      <div style={{ padding: '20px' }}>
        <h1>Привет, {user.firstname || 'Пользователь'}</h1>
        <p>Ваш номер телефона: {user.phone}</p>
        <button onClick={() => { localStorage.removeItem('token'); setUser(null); setStep('PHONE'); }}></button>
      </div>
    );
  }

  return (
    <div className="auth-card">
      <form onSubmit={handleSubmit(step === 'PHONE' ? onSendOtp : onSignIn)}>
        <h2>Вход</h2>
        <p className="subtitle">
          {step === 'PHONE' 
            ? 'Введите номер телефона для входа в личный кабинет' 
            : 'Введите проверочный код для входа в личный кабинет'}
        </p>

        {step === 'PHONE' ? (
          <div className="input-group">
            <input
              className="auth-input"
              {...register('phone', { 
                required: 'Поле является обязательным',
                pattern: { value: /^[0-9]+$/, message: 'Только цифры' } 
              })}
              placeholder="Телефон"
            />
            {errors.phone && <span className="error-message">{errors.phone.message}</span>}
          </div>
        ) : (
          <>
            <div className="input-group">
              <input className="auth-input" value={phoneValue} disabled />
            </div>
            <div className="input-group">
              <input
                className="auth-input"
                {...register('code', { 
                  required: 'Код должен содержать 6 цифр',
                  minLength: { value: 6, message: 'Код должен содержать 6 цифр' },
                  pattern: /[0-9]{6}/
                })}
                placeholder="Проверочный код"
                autoFocus
              />
              {errors.code && <span className="error-message">{errors.code.message}</span>}
            </div>
          </>
        )}

        <button type="submit" className="auth-button" disabled={isLoading}>
          {isLoading ? 'Загрузка...' : (step === 'PHONE' ? 'Продолжить' : 'Войти')}
        </button>

        {step === 'OTP' && (
          <div className="retry-text">
            {retryDelay > 0 ? (
              `Запросить код повторно можно через ${Math.floor(retryDelay / 1000)} секунд`
            ) : (
              <button type="button" className="resend-button" onClick={() => onSendOtp({ phone: phoneValue })}>
                Запросить код ещё раз
              </button>
            )}
          </div>
        )}
      </form>
    </div>
  );


}