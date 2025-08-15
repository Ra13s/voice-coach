// src/App.jsx
import React, { useState } from 'react';
import Disclaimer from './components/Disclaimer';
import Welcome from './components/Welcome';
import Wizard from './components/Wizard';
import DbMeter from './components/DbMeter';
import TimerBreathing from './components/TimerBreathing';

function App() {
    // 'useState' is a React Hook to manage state.
    // 'view' holds the name of the current screen.
    // 'setView' is the function we call to change the screen.
    const [view, setView] = useState('welcome');

    // Simple function to pass to child components for navigation
    const navigateTo = (newView) => {
        setView(newView);
    };

    // Render components conditionally based on the current view state
    return (
        <div className="app-screen" style={{
            minHeight: '100vh',
            width: '100vw',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#f8f9fa',
            padding: '0',
            margin: '0',
            boxSizing: 'border-box'
        }}>
            <div style={{
                width: '100%',
                maxWidth: '1200px',
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
            }}>
                {view === 'disclaimer' && <Disclaimer onAgree={() => navigateTo('welcome')} />}
                {view === 'welcome' && <Welcome navigateTo={navigateTo} />}
                {view === 'morning-routine' && <Wizard navigateTo={navigateTo} routineId="morning" />}
                {view === 'evening-routine' && <Wizard navigateTo={navigateTo} routineId="evening" />}
                {view === 'weekend-routine' && <Wizard navigateTo={navigateTo} routineId="weekend" />}
                {view === 'optional-routine' && <Wizard navigateTo={navigateTo} routineId="optional" />}
                {view === 'wizard' && <Wizard navigateTo={navigateTo} />}
                {view === 'db-meter' && <DbMeter navigateTo={navigateTo} />}
                {view === 'breathing' && <TimerBreathing navigateTo={navigateTo} />}
            </div>
        </div>
    );
}

export default App;