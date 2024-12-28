import {BrowserRouter, Route, Routes} from 'react-router-dom';

import Home from './pages/home';
import SignInPage from './pages/signin';
import SignUpPage from './pages/signup';
import Dashboard from './pages/dashboard';
import {CodingPage} from './pages/codingpage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/signin' element={<SignInPage />} />
        <Route path='/signup' element={<SignUpPage />} />
        <Route path='/dashboard' element={<Dashboard />} />
        <Route path='/code' element={<CodingPage />} />
        <Route path='/' element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
