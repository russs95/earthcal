

let moonDay; // Declare moonDay as a global variable


function getFirstNewMoon() {
  const year = targetDate.getFullYear();
  // const timeZone = targetDate.getTimezoneOffset() / 60;

  // Calculate the moon phase index at midnight on January 1st of the target year
  const moonPhaseIndex = Math.floor(
    SunCalc.getMoonIllumination(new Date(Date.UTC(year, 0, 1, 0, 0, 0))).phase * 100
  );

  // Calculate the day of the year of the first new moon
  const synodicMonth = 29.530588; // average number of days between new moons
  const daysPerPhase = synodicMonth / 100;
  const daysSinceNewMoon = (100 - moonPhaseIndex) * daysPerPhase;
  const firstNewMoonDate =
    new Date(Date.UTC(year, 0, 1, 0, 0, 0)).getTime() + daysSinceNewMoon * 24 * 60 * 60 * 1000;
  const firstNewMoon = new Date(firstNewMoonDate);
  moonDay = getTheDayOfYear(firstNewMoon); // Set the value of moonDay

  rotateLunarMonths(moonDay);
}

    
    function calculateCenterPoint() {
        var lunarMonths = document.getElementById("lunar_months");
        var boundingBox = lunarMonths.getBBox();
        var centerX = boundingBox.x + boundingBox.width / 2;
        var centerY = boundingBox.y + boundingBox.height / 2;
    
        return { x: centerX, y: centerY };
    }
    
    function rotateLunarMonths(moonDay) {
    var lunarMonths = document.getElementById("lunar_months");
    var centerPoint = calculateCenterPoint();

    // Calculate the lunar day difference
    var lunarDayDifference = 28 - moonDay;
    
    // Calculate the equivalent in degrees
    var degrees = -(360/365 * lunarDayDifference);
    
    lunarMonths.style.transition = "transform 3s";

    lunarMonths.style.transformOrigin = centerPoint.x + "px " + centerPoint.y + "px";
    lunarMonths.style.transform = "rotate(" + degrees + "deg)";

    }
    
    

// Sets the color of the Target Day's Lunar Month

   

    function setLunarMonthForTarget() {
        const lunarMonthNumber = getLunarMonthNumber();
        const pathID = `lunar-${lunarMonthNumber}-month`;

        console.log("Path ID:", pathID); // Debugging line

        const pathElement = document.getElementById(pathID);
      
        const svg = document.querySelector('svg');
        const paths = svg.querySelectorAll('path');
      

        paths.forEach(path => {
          if (path.id.includes('lunar-')) {
            path.style.fill = 'none';
            // pathElement.style.fillOpacity = 0;

          }
        });
      
        if (pathElement) {
          const lunarMonthColors = [
            '#7f2affff', '#ff11ceff', '#fb0000ff', '#ff6303ff', '#ff8201ff', '#ffd119ff',
            '#fbfb00ff', '#beee00ff', '#00e513ff', '#00e6a7ff', '#0cacf5ff', '#4343ffff', '#808080ff',
          ];
      
          const targetMonth = targetDate.getMonth();
          pathElement.style.opacity = 1;
          pathElement.style.fill = lunarMonthColors[targetMonth];
        } else {
          console.error("Path not found:", pathID);
        }
      }
      
  
function getLunarMonthNumber() {
    // alert("getLunarMonthNumber, targetDate:" + targetDate);
    getTheDayOfYear(targetDate);
    // alert("getLunarMonthNumber, moonDay: " + moonDay + ", dayOfYear: " + dayOfYear);

    const synodicMonth = 29.530588; // average number of days between new moons
    let lunarMonthNumber = 1;

    console.log("Before calculation - dayOfYear:", dayOfYear, "moonDay:", moonDay); // Debugging

    if (dayOfYear >= moonDay) {
        const daysSinceFirstNewMoon = dayOfYear - moonDay;
        lunarMonthNumber = Math.ceil(daysSinceFirstNewMoon / synodicMonth) + 1;
    } else {
        const daysUntilFirstNewMoon = moonDay - dayOfYear;
        lunarMonthNumber = Math.floor(daysUntilFirstNewMoon / synodicMonth) + 1;
    }

    console.log("lunarMonthNumber:", lunarMonthNumber); // Debugging

    return lunarMonthNumber;
}

    
