import axios from 'axios';
import {useState} from 'react';

import {useNavigate} from 'react-router-dom';

const SignUpPage = () => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [rem, setRem] = useState(false);
  const [isDisabled, setIsDisable] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(''); // State to display error messages
  const navigate = useNavigate();

  function handleClick() {
    navigate('/signin');
  }

  async function handleSubmit() {
    setIsDisable(true);
    setIsLoading(true);
    try {
      const response = await axios.post(
        'http://localhost:3000/api/v1/user/signup',
        {
          name: name,
          email: email,
          password: password,
        }
      );

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
          setErrorMessage(data?.message || 'Email is already taken.');
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
        <h1 className='text-3xl font-bold mb-6 text-center'>Sign Up</h1>
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
              required
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor='name' className='block text-sm font-medium mb-2'>
              Name
            </label>
            <input
              id='name'
              type='text'
              className='w-full px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none'
              placeholder='you@example.com'
              required
              onChange={(e) => setName(e.target.value)}
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
              required
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className='flex items-center justify-between'>
            <label className='flex items-center'>
              <input
                type='checkbox'
                //define onChange here and a state which will set the user cookie
                className='text-blue-500 focus:ring-0 focus:ring-offset-0'
                onChange={() => setRem(!rem)}
              />
              <span className='ml-2 text-sm'>Remember me</span>
            </label>
          </div>
          <button
            type='submit'
            className='w-full py-2 bg-indigo-900 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400'
            disabled={isDisabled}
            onClick={handleSubmit}>
            {isLoading ? 'Loading...' : 'Signup'}
          </button>
        </form>

        {/* Display error message */}
        {errorMessage && (
          <div className='text-red-600 animate-bounce pt-6'>{errorMessage}</div>
        )}
        <p className='mt-6 text-center text-sm text-gray-400'>
          Already have an account?{' '}
          <button
            onClick={handleClick}
            className='text-blue-400 hover:underline'>
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
};

export default SignUpPage;
