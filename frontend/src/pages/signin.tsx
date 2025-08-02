import axios from 'axios';
import {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {API} from '../lib/config';

const SignInPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rem, setRem] = useState(false);
  const [isDisabled, setIsDisable] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(''); // State to display error messages

  const navigate = useNavigate();

  function handleClick() {
    navigate('/signup');
  }

  async function handleSubmit() {
    setIsDisable(true);
    setIsLoading(true);
    setErrorMessage('');
    try {
      const response = await axios.post(`${API.INIT}/api/v1/user/signin`, {
        email: email,
        password: password,
      });

      const token = response.data.data.token;
      localStorage.setItem('token', `Bearer ${token}`);
      navigate('/dashboard');
    } catch (err: unknown) {
      console.log('there was an error', err);
      if (axios.isAxiosError(err)) {
        // Check if the error is an AxiosError
        console.log('there was an Axios error', err);
        const {status, data} = err.response || {}; // Handle cases where 'response' might be undefined
        if (status === 400) {
          setErrorMessage(
            data?.message || 'Invalid input. Please check your credentials.'
          );
        } else if (status === 409) {
          setErrorMessage(
            data?.message || 'User with email and password doesnot exist'
          );
        } else {
          setErrorMessage('An unexpected error occurred. Please try again.');
        }
      } else {
        // Handle other error types
        console.log('Unknown error:', err);
        setErrorMessage('An unexpected error occurred.');
      }
    } finally {
      setIsDisable(false);
      setIsLoading(false);
    }
  }

  return (
    <div className='min-h-screen [background:radial-gradient(125%_125%_at_50%_10%,#000_40%,#63e_100%)] text-white flex items-center justify-center p-6'>
      <div className='w-full max-w-md bg-gray-900 rounded-lg shadow-lg p-8'>
        <h1 className='text-3xl font-bold mb-6 text-center'>Sign In</h1>
        <form className='space-y-6'>
          <div>
            <label htmlFor='email' className='block text-sm font-medium mb-2'>
              Email Address
            </label>
            <input
              id='email'
              type='email'
              className='w-full px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none'
              placeholder='you@example.com'
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label
              htmlFor='password'
              className='block text-sm font-medium mb-2'>
              Password
            </label>
            <input
              id='password'
              type='password'
              className='w-full px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none'
              placeholder='Your password'
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className='flex items-center justify-between'>
            <label className='flex items-center'>
              <input
                type='checkbox'
                className='text-blue-500 focus:ring-0 focus:ring-offset-0'
                onClick={() => setRem(!rem)}
              />
              <span className='ml-2 text-sm'>Remember me{rem ? 'hi' : ''}</span>
            </label>
            <a href='#' className='text-sm text-blue-400 hover:underline'>
              Forgot password?
            </a>
          </div>
          <button
            type='submit'
            className='w-full py-2 bg-indigo-900 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400'
            disabled={isDisabled}
            onClick={handleSubmit}>
            {isLoading ? 'Loading' : 'Signin'}
          </button>
        </form>
        {errorMessage && (
          <div className='text-red-600 animate-bounce pt-6'>{errorMessage}</div>
        )}
        <p className='mt-6 text-center text-sm text-gray-400'>
          Don't have an account?{' '}
          <button
            onClick={handleClick}
            className='text-blue-400 hover:underline'>
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
};

export default SignInPage;
