import {useNavigate} from 'react-router-dom';
import {useCookies} from 'react-cookie';

import {BackgroundBeams} from '../components/ui/background-beam';
import {Button} from '../components/ui/moving-border';
import {FlipWords} from '../components/ui/flip-words';
import Marquee from 'react-fast-marquee';

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

  const words = ['Anywhere', 'Anytime'];
  //bg-gradient-to-br from-gray-900 via-gray-800 to-black
  //<div class="relative h-full w-full bg-black"><div class="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div><div class="absolute left-0 right-0 top-[-10%] h-[1000px] w-[1000px] rounded-full bg-[radial-gradient(circle_400px_at_50%_300px,#fbfbfb36,#000)]"></div></div>
  return (
    <div className='min-h-screen [background:radial-gradient(125%_125%_at_50%_10%,#000_40%,#63e_100%)] text-white '>
      <div className='absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] flex items-center justify-center'>
        <div className='text-center z-10 flex flex-col items-center gap-5'>
          <h1 className='text-8xl font-semibold mb-6 text-slate-100'>
            Cloud IDE
          </h1>
          <p className='text-xl mb-8 text-gray-200'>
            Code
            <FlipWords words={words} />
            in your <span className='underline text-slate-50'>browser.</span>
          </p>
          <Button
            onClick={handleButtonClick}
            className='px-6 py-3 bg-indigo-900 hover:bg-indigo-700 rounded-lg text-lg font-semibold shadow-lg focus:outline-none focus:ring cursor-pointer'>
            Get Started
          </Button>
          <Marquee className='overflow-hidden grid max-w-96 my-8'>
            <div className='h-10 w-10 m-7'>
              <img src='/c-1.svg'></img>
            </div>
            <div className='h-10 w-10 m-7'>
              <img src='/c.svg'></img>
            </div>
            <div className='h-10 w-10 m-7'>
              <img src='/html-1.svg'></img>
            </div>
            <div className='h-10 w-10 m-7'>
              <img src='/logo-javascript.svg'></img>
            </div>
            <div className='h-10 w-10 m-7'>
              <img src='/python-4.svg'></img>
            </div>
            <div className='h-10 w-10 m-7'>
              <img src='/java-vertical.svg'></img>
            </div>
          </Marquee>
        </div>
        <BackgroundBeams />
      </div>
    </div>
  );
};

export default Home;
