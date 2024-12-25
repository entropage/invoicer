// @flow
import * as React from 'react';
import {useState} from 'react';
import {useHistory} from 'react-router-dom';
import {setAuthToken} from '../../utils';
import {Buffer} from 'buffer';

// Make Buffer available globally
if (typeof window !== 'undefined') {
  window.Buffer = Buffer;
}

export function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const history = useHistory();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({username, password}),
      });

      const data = await response.json();

      if (response.ok) {
        setAuthToken(data.token);
        history.push('/');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px',
    }}>
      <div style={{
        maxWidth: '400px',
        width: '100%',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        backgroundColor: '#fff',
      }}>
        <h1 style={{textAlign: 'center', marginBottom: '20px'}}>Login</h1>
        {error && (
          <div style={{
            padding: '10px',
            marginBottom: '20px',
            backgroundColor: '#ffebee',
            color: '#c62828',
            borderRadius: '4px',
          }}>
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div style={{marginBottom: '15px'}}>
            <label style={{display: 'block', marginBottom: '5px'}}>
              Username:
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                }}
              />
            </label>
          </div>
          <div style={{marginBottom: '20px'}}>
            <label style={{display: 'block', marginBottom: '5px'}}>
              Password:
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                }}
              />
            </label>
          </div>
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: '#2196f3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
} 