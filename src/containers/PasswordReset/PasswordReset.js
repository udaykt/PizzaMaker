import React from 'react';

const PasswordReset = (props) => {
  return (
    <div className={true ? 'loginPage' : 'hideLoginPage'}>
      <form onSubmit={handleLoginUser}>
        <div>
          <h1>Login</h1>
        </div>
        <div className='formInputTextDiv'>
          <div className='labelInputDiv'>
            <label htmlFor='email'>Email</label>
            <div className={'inputField'}>
              <input
                id='email'
                name='email'
                type='email'
                value={loginEmail}
                autoFocus
                onChange={(e) => setLoginEmail(e.target.value)}
                required
              />
            </div>
          </div>
          <div className='labelInputDiv'>
            <label htmlFor='password'>Password</label>
            <div className={'inputField'}>
              <input
                id='password'
                name='password'
                type='password'
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
              />
            </div>
          </div>
        </div>
        <Button className={'loginSubmitButton'} type='submit'>
          Login
        </Button>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div className='formLink'>
            <NavLink to={SIGNUP_PATH} style={{ textDecoration: 'none' }}>
              Create an account?
            </NavLink>
          </div>
          /
          <div className='formLink'>
            <NavLink to={GUEST_PATH} style={{ textDecoration: 'none' }}>
              Continue as Guest?
            </NavLink>
          </div>
        </div>
      </form>
    </div>
  );
};

export default PasswordReset;
