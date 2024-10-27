
/*

HIGHLIGHT CURRENT DATE 


-------------------------------

*/

function updateTargetDay() {
  const startOfYear = new Date(Date.UTC(targetDate.getFullYear(), 0, 1));
  const diff = targetDate.getTime() - startOfYear.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
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
            path.style.fillOpacity = 0;
          } else {
            path.style.fillOpacity = '0.3';
          }
        }
      }
    });
    
  });
}


//TURN APPROPRIATE SET OF MONTH COLORS ON

function setYearsMonthsOn() {
  // Get the year from the global variable targetDate
  const targetDateObj = new Date(targetDate);
  const year = targetDateObj.getFullYear();

  // Determine if the year is a leap year
  const isLeapYear = (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0));

  // alert('Is ' + year + 'setYearsMonthsOn() a leap year? ' + isLeapYear);

  // Get the SVG groups by their IDs
  const solarMonths366 = document.getElementById('solar_months_366');
  const solarMonths365 = document.getElementById('solar_months_365');

  if (isLeapYear) {
    // Set opacity for a leap year
    solarMonths366.style.opacity = '1'; 
    solarMonths365.style.opacity = '0'; 
  } else {
    solarMonths366.style.opacity = '0'; 
    solarMonths365.style.opacity = '1'; 
  }
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


function updateTargetMonth() {
  // Ensure targetDate is a Date object
  const targetDateObj = new Date(targetDate);
  const targetMonth = targetDateObj.getMonth();
  const targetYear = targetDateObj.getFullYear();

  // Determine if the year is a leap year
  const isLeapYear = (targetYear % 4 === 0 && (targetYear % 100 !== 0 || targetYear % 400 === 0));

  // Get the month name and convert it to lowercase
  const monthName = getMonthName(targetMonth).toLowerCase();

  // Select all paths ending with _365 or _366 and clear the 'active-month' class
  const allPaths = document.querySelectorAll('path[id$="_365"], path[id$="_366"]');
  allPaths.forEach(path => {
    path.classList.remove('active-month');
  });

  // Construct the ID using the month name and leap year information
  const pathId = `${monthName}_${isLeapYear ? '366' : '365'}`;

  // Select the path with the constructed ID
  const targetPath = document.getElementById(pathId);
  if (targetPath) {
    // Add the 'active-month' class to the matched path
    targetPath.classList.add('active-month');
  } else {
    console.error(`No path found with ID ${pathId}`);
  }
}

function getMonthName(monthIndex) {
  // Array of month names
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return monthNames[monthIndex];
}


