import { Toaster } from 'react-hot-toast';
import './App.css';
import Home from '@/pages/Home/Home';

const App = (props) => {
  return (
    <div className='App'>
      <Toaster
        position='top-right'
        toastOptions={{
          duration: 3500,
          style: { background: '#1e1e1e', color: '#fff', borderRadius: '10px' },
          success: { iconTheme: { primary: '#ff6b00', secondary: '#fff' } },
          error: { iconTheme: { primary: '#e53935', secondary: '#fff' } },
        }}
      />
      <Home />
    </div>
  );
};

export default App;
