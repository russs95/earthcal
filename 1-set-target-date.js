
/*

HIGHLIGHT CURRENT DATE 


-------------------------------

*/

function updateTargetDay() {
  const startOfYear = new Date(Date.UTC(targetDate.getFullYear(), 0, 1));
  const diff = targetDate.getTime() - startOfYear.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24)) + 2;
  const dayIdStart = `${dayOfYear}-`;

  const svg = document.querySelector('svg');
  const paths = svg.querySelectorAll('path');
  paths.forEach((path) => path.classList.remove("final"));

  paths.forEach(path => {
    if (path.id.startsWith(dayIdStart) && path.id.endsWith('-day')) {
      path.style.fillOpacity = '1';
    } else {
      if (path.id.includes(`-day`) && !path.id.includes(`-marker`)) {
        path.style.fillOpacity = '0.3';
      }
      
    }

    path.addEventListener('mouseenter', () => {
      if (path.id.startsWith(dayIdStart) && path.id.endsWith('-day')) {
        path.style.fillOpacity = '1';
      } else {
        if (path.id.includes(`-day`)) {
          path.style.fillOpacity = '0.8';
        }
      }
    });

    path.addEventListener('mouseleave', () => {
      if (path.id.startsWith(dayIdStart) && path.id.endsWith('-day')) {
        path.style.fillOpacity = '1';
      } else {
        if (path.id.includes(`-day`)) {
          if (path.id.includes(`-marker`)) {
            // Reset -marker paths to their original state
            path.style.fillOpacity = 0.1;
          } else {
            path.style.fillOpacity = '0.3';
          }
        }
      }
    });
    
  });
}


//Set the color of the Target Day's Week

function updateTargetWeekColor() {
  const targetWeek = Math.ceil((targetDate - new Date(targetDate.getFullYear(), 0, 1)) / 604800000);
  const targetMonth = targetDate.getMonth();
  const colors = [
    '#7f2affff', '#ff11ceff', '#fb0000ff', '#ff6303ff', '#ff8201ff', '#ffd119ff',
    '#fbfb00ff', '#beee00ff', '#00e513ff', '#00e6a7ff', '#0cacf5ff', '#4343ffff',
  ];

  const svg = document.querySelector('svg');
  const paths = svg.querySelectorAll('path');

  paths.forEach(path => {
    if (path.id.includes('week-')) {  
        path.style.fill = 'var(--weeks-circle)';
    } else {
    }
  });

  
  paths.forEach(path => {
    if (path.id === `week-${targetWeek}`) {
      path.style.opacity = 0.9;
      path.style.fill = colors[targetMonth];
    } else {

    }
  });
}

//Sets the Color of the Target Day's Month

function updateTargetMonth() {
  const targetMonth = targetDate.getMonth();

  const svg = document.querySelector('svg');
  const paths = svg.querySelectorAll('path');

  const monthRegex = /(january|february|march|april|may|june|july|august|september|october|november|december)/;

  paths.forEach(path => {
    if (monthRegex.test(path.id)) {  
      path.style.opacity = '0.5';
    } else {
    }
  });

  const quadrantElement = document.getElementById(`${getMonthName(targetMonth).toLowerCase()}`);
  quadrantElement.style.opacity = "0.9";
  quadrantElement.style.transition = "opacity 1s";
}


function getMonthName(monthIndex) {
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return monthNames[monthIndex];
}

