import {useNavigate} from 'react-router-dom';

const SignInForm = () => {
  const navigate = useNavigate();
  function handleClick() {
    navigate('/signup');
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
              required
            />
          </div>
          <div className='flex items-center justify-between'>
            <label className='flex items-center'>
              <input
                type='checkbox'
                className='text-blue-500 focus:ring-0 focus:ring-offset-0'
              />
              <span className='ml-2 text-sm'>Remember me</span>
            </label>
            <a href='#' className='text-sm text-blue-400 hover:underline'>
              Forgot password?
            </a>
          </div>
          <button
            type='submit'
            className='w-full py-2 bg-indigo-900 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400'>
            Sign In
          </button>
        </form>
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

export default SignInForm;
