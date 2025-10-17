
/* ----------------------------------
  
  
    GOOGLE CALENDAR CONNECT 
  
  
    ---------------------------------------*/
  
  

    // Replace with your own API Key and Client ID
    const apiKey = 'AIzaSyADEyyPayxCnPlSDiUoVE6sDlYmNddgowY';
    const clientId = 'YOUR_CLIENT_ID';
    const scope = 'https://www.googleapis.com/auth/calendar.readonly';
  
    // Load the API client and auth2 library
    function loadClient() {
      gapi.load('client:auth2', initClient);
    }
  
    // Initialize the client with API key and client ID
    function initClient() {
      gapi.client.init({
        apiKey: apiKey,
        clientId: clientId,
        scope: scope
      }).then(() => {
        document.getElementById('get-events').addEventListener('click', getEvents);
      });
    }
  
    // Authenticate and fetch the events
    async function getEvents() {
      try {
        await gapi.auth2.getAuthInstance().signIn();
        const calendarId = 'primary';
        const now = new Date();
        const eventsResponse = await gapi.client.calendar.events.list({
          calendarId: calendarId,
          timeMin: now.toISOString(),
          timeMax: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString(),
          showDeleted: false,
          singleEvents: true,
          orderBy: 'startTime'
        });
  
        displayEvents(eventsResponse.result.items);
      } catch (error) {
        console.error('Error fetching events', error);
      }
    }
  
    // Display the events on the page
    function displayEvents(events) {
      const eventsContainer = document.getElementById('events-container');
      eventsContainer.innerHTML = '';
  
      if (events.length > 0) {
        events.forEach(event => {
          const eventElement = document.createElement('div');
          eventElement.textContent = `${event.start.dateTime || event.start.date}: ${event.summary}`;
          eventsContainer.appendChild(eventElement);
        });
      } else {
        eventsContainer.innerHTML = '<p>No events found for today.</p>';
      }
    }
  
    // Load the API client
    loadClient();




    function addDateTitles() {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    
    for (let i = 1; i <= 365; i++) {
      const path = document.getElementById(`${i}-day`);
      if (!path) continue;
      
      const date = new Date(currentYear, 0);
      date.setDate(i);
      
      const dateString = `${date.getMonth() + 1}-${date.getDate()}-${currentYear}`;
      const formattedDate = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(date);
      
      path.setAttribute('title', formattedDate);
    }
  }
  
  addDateTitles();



function connectGcal(calendarUrl) {
  void calendarUrl;
  alert('Sorry! This functionality is still in development. Hold tight! Almost there.');
}

if (typeof window !== 'undefined') {
  window.connectGcal = connectGcal;
}
