


function setLunarMonthForTarget(targetDate, currentYear) {

    // Reset the opacity of all lunarmonth-12 paths to 0.6 and remove all classes
    const lunarMonthPaths = document.querySelectorAll('path[id*="lunarmonth-12"]');
    lunarMonthPaths.forEach(path => {
        path.classList.forEach(cls => {
            path.classList.remove(cls);
        });
    });

    // Get the current solar month
    const targetMonth = targetDate.getMonth();
    const monthNames = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
    const targetMonthName = monthNames[targetMonth];


    // Get the lunar month number
    let lunarMonthNumber = getLunarMonthNumber(targetDate, currentYear);

    const pathID = `${lunarMonthNumber}-lunarmonth-12`;

    // Select the appropriate lunar month div
    const pathElement = document.getElementById(pathID);
    if (pathElement) {
        // Add the solar month name class to the lunar div
        pathElement.classList.add(targetMonthName);
        // Set the opacity of the specified lunarmonth-12 div to 1

    } else {
        console.error("Path not found:", pathID);
    }
}


function getLunarMonthNumber(targetDate, currentYear) {

    // Calculate the day of the year for the target date
    const dayOfYear = getDayOfYear(targetDate);

    // Get the first new moon date of the year
    const firstNewMoon = getFirstNewMoon(currentYear);
    let moonDay = getDayOfYear(firstNewMoon) + 1; // Set the value of moonDay and add 1

    // Log the final value of moonDay to the console with up to two decimals
    //alert(`The first new moon of the year is ${moonDay.toFixed(2)} days into January.`);



    // Calculate the lunar month number based on the day of the year and moon day
    const synodicMonth = 29.530588; // Average number of days between new moons
    // let lunarMonthNumber = 1;
    if (dayOfYear >= moonDay) {
        const daysSinceFirstNewMoon = dayOfYear - moonDay;
        lunarMonthNumber = Math.ceil(daysSinceFirstNewMoon / synodicMonth) + 2;
    } else {
        const daysUntilFirstNewMoon = moonDay - dayOfYear;
        lunarMonthNumber = 2;
    }


    rotateLunarMonths(moonDay);
    return lunarMonthNumber;
}




let firstNewMoonDate;  // Declare firstNewMoonDate as a global variable
const synodicMonth = 29.530588;  // Average length of a lunar month in days
const referenceFullMoon = new Date(Date.UTC(2025, 0, 29, 12, 35, 0)); // Jan 29, 2025, 12:35 UTC

function getFirstNewMoon(currentYear) {
    // Use user_timezone if set, otherwise default to UTC
    let timezoneOffset = 0;  // Default to UTC
    if (typeof user_timezone !== "undefined" && user_timezone) {
        timezoneOffset = new Date().getTimezoneOffset() * 60 * 1000; // Convert minutes to milliseconds
    }

    // Estimate the number of synodic months between 2025 and the desired year
    const yearDifference = currentYear - 2025;
    const newMoonDaysShift = yearDifference * 12 * synodicMonth; // Approximate number of months
    const estimatedNewMoonDate = new Date(referenceFullMoon.getTime() + newMoonDaysShift * 24 * 60 * 60 * 1000);

    // Adjust for the user's timezone
    firstNewMoonDate = new Date(estimatedNewMoonDate.getTime() - timezoneOffset);

    return firstNewMoonDate;
}


function rotateLunarMonths(moonDay) {
    var lunarMonths = document.getElementById("lunar_months-12");
    var svg = document.getElementById("EarthCycles");

    // Get the SVG's viewBox center
    var viewBox = svg.getAttribute("viewBox").split(" ");
    var centerX = parseFloat(viewBox[0]) + parseFloat(viewBox[2]) / 2;
    var centerY = parseFloat(viewBox[1]) + parseFloat(viewBox[3]) / 2;

    // Calculate the lunar day difference
    var lunarDayDifference = moonDay;

    // Calculate the equivalent in degrees
    var degrees = -(360 / 365 * lunarDayDifference)+17;

    // Preserve any existing transformations by appending rotation instead of replacing the whole transform attribute
    let currentTransform = lunarMonths.getAttribute("transform") || "";

    // Remove any previous rotate() transforms to avoid accumulation issues
    currentTransform = currentTransform.replace(/rotate\([^)]+\)/, "").trim();

    // Apply rotation without affecting scale
    lunarMonths.setAttribute("transform", `${currentTransform} rotate(${degrees}, ${centerX}, ${centerY})`);
}




function calculateCenterPoint() {
    var lunarMonths = document.getElementById("lunar_months-12");
    var boundingBox = lunarMonths.getBBox();
    var centerX = boundingBox.x + boundingBox.width / 2;
    var centerY = boundingBox.y + boundingBox.height / 2;

    return { x: centerX, y: centerY };
}



// Calculate the Hijri month names for a given year and update the title tag of the paths
function calculateHijriMonthNames(currentYear) {
  // Get the date of the first new moon of the current year
  const firstNewMoon = getFirstNewMoon(currentYear);

  // Define the base date (why this?)
  const baseDate = new Date(Date.UTC(2025, 0, 13)); // is this the first month day of the year?
  const baseHijriMonthIndex = 6; // Rajab is the 7th month (index 6)

  // Calculate the difference in days between the base date and the first new moon date
  const oneDay = 1000 * 60 * 60 * 24;
  const dayDifference = Math.floor((firstNewMoon - baseDate) / oneDay);

  // Calculate the Hijri month names for the paths
  let hijriMonthIndex = baseHijriMonthIndex;
  let daysRemaining = dayDifference;

  const hijriMonths = [
      { name: "Muharram", days: 30 },
      { name: "Safar", days: 29 },
      { name: "Rabi' al-Awwal", days: 30 },
      { name: "Rabi' al-Thani", days: 29 },
      { name: "Jumada al-Awwal", days: 30 },
      { name: "Jumada al-Thani", days: 29 },
      { name: "Rajab", days: 30 },
      { name: "Sha'ban", days: 29 },
      { name: "Ramadan", days: 30 },
      { name: "Shawwal", days: 29 },
      { name: "Dhu al-Qi'dah", days: 30 },
      { name: "Dhu al-Hijjah", days: 29 }
  ];

  // Decrement the initial Hijri month index by 1 to start allocation one month earlier
  hijriMonthIndex = (hijriMonthIndex - 1 + 12) % 12;

  for (let i = 1; i <= 13; i++) {
      while (daysRemaining >= hijriMonths[hijriMonthIndex].days) {
          daysRemaining -= hijriMonths[hijriMonthIndex].days;
          hijriMonthIndex = (hijriMonthIndex + 1) % 12;
      }

      const hijriMonthName = hijriMonths[hijriMonthIndex].name;
      const pathID = `${i}-lunarmonth-12`;
      const pathElement = document.getElementById(pathID);
      if (pathElement) {
          pathElement.setAttribute('title', hijriMonthName);
      } else {
          console.error("Path not found:", pathID);
      }

      // Move to the next month
      hijriMonthIndex = (hijriMonthIndex + 1) % 12;
      daysRemaining -= hijriMonths[hijriMonthIndex].days;
  }
}






  