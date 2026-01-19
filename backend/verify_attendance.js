const axios = require('axios');

async function testPunchIn() {
    try {
        const response = await axios.post('http://localhost:5000/api/attendance/punch-in', {
            employeeId: 'EMP_VERIFY_01',
            location: {
                latitude: 12.9716, // Matches office location
                longitude: 77.5946
            },
            wifiBSSID: 'AA:BB:CC:DD:EE:FF' // Matches office BSSID
        });
        console.log('Punch In Response:', response.data);
    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
}

testPunchIn();
