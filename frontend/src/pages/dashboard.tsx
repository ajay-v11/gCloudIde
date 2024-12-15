import {useState} from 'react';

const Dashboard = () => {
  const projects = ['Project Alpha', 'Project Beta', 'Project Gamma'];
  const languages = [
    {
      name: 'JavaScript',
      logo: <img src='/logo-javascript.svg' className='h-20 w-20'></img>,

      description: 'Dynamic language for the web',
    },
    {
      name: 'Python',
      logo: <img src='/python-4.svg' className='h-20 w-20'></img>,
      description: 'Versatile language for many domains',
    },
    {
      name: 'Java',
      logo: <img src='/java-vertical.svg ' className='h-20 w-20'></img>,
      description: 'Popular for enterprise applications',
    },
    {
      name: 'C',
      logo: <img src='/c-1.svg' className='h-20 w-20'></img>,
      description: 'Popular for enterprise applications',
    },
    {
      name: 'C++',
      logo: <img src='/c.svg' className='h-20 w-20'></img>,
      description: 'Popular for enterprise applications',
    },
    {
      name: 'html',
      logo: <img src='/html-1.svg' className='h-20 w-20'></img>,
      description: 'Popular for enterprise applications',
    },
  ];

  const [selectedLanguage, setSelectedLanguage] = useState('');

  const handleLanguageSelect = (languageName: string) => {
    setSelectedLanguage(languageName);
  };

  return (
    <div className='flex min-h-screen [background:radial-gradient(125%_125%_at_50%_10%,#000_40%,#63e_100%)] text-white'>
      {/* Sidebar */}
      <aside className='w-64 bg-black p-4 border border-1 border-gray-800'>
        <h2 className='text-xl font-semibold mb-20'>Welcome user</h2>
        <h2 className='text-xl font-semibold mb-4'>Previous Projects</h2>
        <ul className='space-y-2'>
          {projects.map((project, index) => (
            <li
              key={index}
              className='p-2 bg-gray-900 rounded hover:bg-gray-800 cursor-pointer'>
              {project}
            </li>
          ))}
        </ul>
      </aside>

      {/* Main Content */}
      <main className='flex-1 p-6 pt-14'>
        <div className=' max-w-3xl mx-auto space-y-8'>
          {/* New Project Card */}

          <div className='bg-gray-900 p-10 rounded-lg shadow-lg  '>
            <h3 className='text-2xl font-bold mb-4'>Create a New Project</h3>
            <div className='space-y-10'>
              <div>
                <label
                  htmlFor='project-name'
                  className='block text-sm font-medium mb-2'>
                  Project Name
                </label>
                <input
                  id='project-name'
                  type='text'
                  placeholder='Enter project name'
                  className='w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none'
                />
              </div>
              <div>
                <h4 className='text-lg font-semibold mb-2'>Select Language</h4>
                <div className='grid grid-cols-3 gap-4'>
                  {languages.map((lang, index) => (
                    <div
                      key={index}
                      className={`p-4 bg-gray-700 rounded-lg shadow-md cursor-pointer transition ease-in-out hover:-translate-y-1 hover:scale-110 hover:bg-indigo-800 duration-75 ${
                        selectedLanguage === lang.name
                          ? 'bg-indigo-800 text-slate-100 '
                          : 'bg-gray-700'
                      }`}
                      onClick={() => handleLanguageSelect(lang.name)}>
                      <div className='flex items-center space-x-3'>
                        <span className='text-2xl'>{lang.logo}</span>
                        <div>
                          <h5 className='font-semibold'>{lang.name}</h5>
                          <p className='text-sm text-gray-400'>
                            {lang.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <button className='w-full text-large py-4 bg-indigo-900 hover:bg-idigo-700 text-white font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-purple-700 transition ease-in-out hover:-translate-y-1 hover:scale-110 hover:bg-indigo-500 duration-150'>
                Start writing a new program in {selectedLanguage}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
