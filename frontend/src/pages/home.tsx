import {useNavigate} from 'react-router-dom';
import {useCookies} from 'react-cookie';

const Home = () => {
  const navigate = useNavigate();
  const [cookies] = useCookies(['user']); // Access the "user" cookie

  const handleButtonClick = () => {
    const userLoggedIn = cookies.user; // Check if the "user" cookie exists
    if (userLoggedIn) {
      navigate('/dashboard'); // Redirect to the dashboard if logged in
    } else {
      navigate('/signin'); // Redirect to the sign-in page if not logged in
    }
  };
  //bg-gradient-to-br from-gray-900 via-gray-800 to-black
  //<div class="relative h-full w-full bg-black"><div class="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div><div class="absolute left-0 right-0 top-[-10%] h-[1000px] w-[1000px] rounded-full bg-[radial-gradient(circle_400px_at_50%_300px,#fbfbfb36,#000)]"></div></div>
  return (
    <div className='min-h-screen [background:radial-gradient(125%_125%_at_50%_10%,#000_40%,#63e_100%)] text-white '>
      <div className='absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] flex items-center justify-center'>
        <div className='text-center'>
          <h1 className='text-5xl font-bold mb-6 text-slate-200'>Cloud IDE</h1>
          <p className='text-xl mb-8 text-gray-400'>
            Code from anywhere, in any language, in your browser.
          </p>
          <button
            onClick={handleButtonClick}
            className='px-6 py-3 bg-indigo-900 hover:bg-indigo-700 rounded-lg text-lg font-semibold shadow-lg focus:outline-none focus:ring focus:ring-blue-400'>
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
