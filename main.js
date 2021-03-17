latitude = 41.8781 
longitude = -87.6298 

now = new Date()
yesterday = new Date()
yesterday.setDate(now.getDate() - 1)
yesterday.setHours(12,0,0)
today = new Date()
today.setHours(12,0,0)
tomorrow = new Date()
tomorrow.setDate(now.getDate() + 1)
tomorrow.setHours(12,0,0)

let startTime = new Date()
startTime.setMinutes(Math.floor(startTime.getMinutes() / 15)*15, 0)
let endTime = new Date()
endTime.setHours(12, 0, 0)
endTime.setDate(endTime.getDate() + 1)

sunTimes = [yesterday, today, tomorrow].map(x => SunCalc.getTimes(x, latitude, longitude))
moonTimes = [yesterday, today, tomorrow].map(x => SunCalc.getMoonTimes(x, latitude, longitude))
galacticCenterTimes = [yesterday, today, tomorrow].map(x => SunCalc.getGalacticCenterTimes(x, latitude, longitude))

moonTimes = []
sunTimes = []
gcTimes = []

for (let i = -1; i <= 2; i++) {
    day = new Date()
    day.setDate(today.getDate() + i)
    day.setHours(12, 0, 0)
    moonTimes.push(SunCalc.getMoonTimes(day, latitude, longitude))
    //sunTime = SunCalc.getTimes(day, latitude, longitude)
    //sunTimes.push({'night': sunTime.night, 'nightEnd':sunTime.nightEnd})
    sunTimes.push(SunCalc.getTimes(day, latitude, longitude))
    gcTimes.push(SunCalc.getGalacticCenterTimes(day, latitude, longitude))
}

flatMoonTimes = [].concat.apply([], moonTimes.map(x => Object.entries(x))).map(x => {return {'time':x[1], 'type':x[0]}; }).sort((a, b) => a.time.valueOf() - b.time.valueOf())
flatSunTimes = [].concat.apply([], sunTimes.map(x => Object.entries(x))).map(x => {return {'time':x[1], 'type':x[0]}; }).sort((a, b) => a.time.valueOf() - b.time.valueOf())
flatGCTimes = [].concat.apply([], gcTimes.map(x => Object.entries(x))).map(x => {return {'time':x[1], 'type':x[0]}; }).sort((a, b) => a.time.valueOf() - b.time.valueOf())

sunBlockTimes = []

for (let i = 0; i < flatSunTimes.length - 1; i++) {
    let block = [flatSunTimes[i], flatSunTimes[i+1]]
    if (flatSunTimes[i].time < endTime) sunBlockTimes.push(block);
}



let height = 200;
let width = 960;

let margin = {
    top: 20,
    right: 20,
    bottom: 20,
    left: 0
}

let chartHeight = height - margin.top - margin.bottom;
let chartWidth = width - margin.left - margin.right;

const svg = d3.select("#chartSvg")
    .attr('height', height)
    .attr('width', width)

const mask = svg.append('mask')
    .attr('id', 'chartMask')
    .append('rect')
    .attr('width', chartWidth)
    .attr('height', chartHeight)
    .attr('fill', 'white')

const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)

const maskedG = svg.append('g')
    .attr('mask', 'url(#chartMask)')
    .attr('transform', `translate(${margin.left},${margin.top})`)

xScale = d3.scaleTime().domain([startTime, endTime]).range([0, chartWidth])
yScale = d3.scaleLinear().domain([0, Math.PI/2]).range([chartHeight, 0])

xAxis = d3.axisBottom(xScale)

skyColors = {
    'nightSky': '#000026',
    'darkSky' : '#2c0b4d',
    'twilight': '#733973',
    'riseSet': '#b35071',
    'goldenHour': '#ffcc73',
    'daySky': '#ffff73'
}

gcColors = {
    'nightSky': '#f1ebd3',
    'darkSky' : '#7b6583',
    'twilight': '#8c5d86',
    'riseSet': '#b9607b',
    'goldenHour': '#febe7d',
    'daySky': '#ffff73'
}

sunColor = {
    'nadir': skyColors.nightSky,
    'nightEnd': skyColors.darkSky,
    'nauticalDawn': skyColors.twilight,
    'dawn': skyColors.riseSet,
    'sunrise': skyColors.riseSet,
    'sunriseEnd': skyColors.goldenHour,
    'goldenHourEnd': skyColors.daySky,

    'solarNoon': skyColors.daySky,
    'goldenHour': skyColors.goldenHour,
    'sunsetStart': skyColors.riseSet,
    'sunset': skyColors.riseSet,
    'dusk': skyColors.twilight,
    'nauticalDusk': skyColors.darkSky,
    'night': skyColors.nightSky
}

function gcColor(time) {
    let sunTimes = flatSunTimes.filter(x => x.time < time)
    let type = sunTimes[sunTimes.length - 1].type

    let colorTypes = {
        'nadir': gcColors.nightSky,
        'nightEnd': gcColors.darkSky,
        'nauticalDawn': gcColors.twilight,
        'dawn': gcColors.riseSet,
        'sunrise': gcColors.riseSet,
        'sunriseEnd': gcColors.goldenHour,
        'goldenHourEnd': gcColors.daySky,

        'solarNoon': gcColors.daySky,
        'goldenHour': gcColors.goldenHour,
        'sunsetStart': gcColors.riseSet,
        'sunset': gcColors.riseSet,
        'dusk': gcColors.twilight,
        'nauticalDusk': gcColors.darkSky,
        'night': gcColors.nightSky
    }

    return colorTypes[type]
}

sunBlocks = maskedG.selectAll('.sunBlock').data(sunBlockTimes)
    .enter()
    .append('rect')
    .attr('x', d => Math.floor(xScale(d[0].time)))
    .attr('y', 0)
    .attr('width', d => Math.ceil(xScale(Math.min(d[1].time, endTime)) - xScale(Math.min(d[0].time))))
    .attr('height', chartHeight)
    .attr('fill', d => sunColor[d[0].type])
    // .attr('fill', 'black')


g.append('g')
 .attr('class', 'x-axis')
 .attr('transform', `translate(0, ${chartHeight})`)
 .call(xAxis)


let moonPositions = []
let gcPositions = []

for (let i = 0; i < endTime.valueOf() - startTime.valueOf(); i += 15*60*1000) {
    let time = new Date(startTime.valueOf() + i )
    // let position = SunCalc.getGCPosition(time, latitude, longitude)
    let position0 = SunCalc.getStarPosition(time, latitude, longitude, (17 + 47/60 + 58.9/3600), -(28 + 4/60  + 53/3600))
    let position =  SunCalc.getStarPosition(time, latitude, longitude, (17 + 45/60 + 37.2/3600), -(28 + 56/60 + 10/3600))
    let position1 = SunCalc.getStarPosition(time, latitude, longitude, (17 + 43/60 + 13.1/3600), -(29 + 47/60 + 18/3600))
    let result = {}
    result.time = time
    result.position0 = position0
    result.position = position
    result.position1 = position1
    if (position.altitude > 0) gcPositions.push(result)
    
    let moonPosition = SunCalc.getMoonPosition(time, latitude, longitude)
    moonPosition.time = time
    if (moonPosition.altitude > 0) moonPositions.push(moonPosition)
}

let galaxyLineRadius = 300

maskedG.selectAll('.gcPosition').data(gcPositions)
    .enter()
  .append('line')
    .attr('x1', d => xScale(d.time) + galaxyLineRadius*(d.position0.azimuth - d.position1.azimuth))
    .attr('x2', d => xScale(d.time) - galaxyLineRadius*(d.position0.azimuth - d.position1.azimuth))
    // .attr('x2', d => xScale(d.time) + 5)
    .attr('y1', d => yScale(d.position0.altitude) - galaxyLineRadius*(d.position0.altitude - d.position1.altitude))
    .attr('y2', d => yScale(d.position1.altitude) + galaxyLineRadius*(d.position0.altitude - d.position1.altitude))
    // .attr('y2', d => yScale(d.position1.altitude))
    .attr('stroke', d => gcColor(d.time))

maskedG.selectAll('.gcPosition').data(gcPositions)
    .enter()
  .append('circle')
    .attr('cx', d => xScale(d.time))
    .attr('cy', d => yScale(d.position.altitude))
    .attr('r', 2)
    .attr('fill', d => gcColor(d.time))


let moonDiameter = 10
phase = SunCalc.getMoonIllumination(now).phase

maskedG.selectAll('.moonPosition').data(moonPositions)
    .enter()
  .append('circle')
    .attr('cx', d => xScale(d.time))
    .attr('cy', d => yScale(d.altitude))
    .attr('r', 0.5*moonDiameter)
    .attr('fill', '#DDD')

maskedG.selectAll('.moonPosition').data(moonPositions)
    .enter()
  .append('path')
    .attr('d', d => `M0 ${-0.5*moonDiameter} c${(phase - 0.5) * moonDiameter * 4/3} 0, ${(phase - 0.5) * moonDiameter * 4/3} ${moonDiameter}, 0 ${moonDiameter} c${moonDiameter * 2/3} 0, ${moonDiameter * 2/3} ${-moonDiameter}, 0 ${-moonDiameter}`)
    .attr('transform', d => `translate(${xScale(d.time)},${yScale(d.altitude)})`)
    .attr('fill', '#222')


// //`RA 17h 45m 40.04s, Dec −29° 00′ 28.1″`

// ra = (17 + 45/60 + 40.04/3600) * Math.PI/12
// dec = -(29 + 28.1/3600) * Math.PI/180

// // ra = ra / 24 * 2*Math.PI
// // dec = dec * Math.PI/180

// latitude = 41.8781 
// longitude = -87.6298 

// date = new Date(2021, 2, 14, 11, 12, 0)
// // expected rise: 3h02m
// // expected transit: 7h07m
// // expected set: 11h12m

// lat = latitude
// lng = longitude




// // // worked example from http://www.stargazing.net/kepler/altaz.html
// // rad  = Math.PI / 180;

// // ra = (16 + 41.7/60) * 15 * Math.PI/180 // radians
// // dec = (36 + 28/60) * Math.PI/180 // radians

// // latitude = (52 + 30/60) // degrees
// // longitude = -(1 + 55/60) // degrees

// // date = new Date(1998, 8, 10, 23, 10)
// // UT = 23 + 10/60

// // d = -508.53472 // days from J2000

// // function LST(d, lng, UT) { return Math.PI/180 * (100.46 + 0.985647 * d + lng + 15*UT); }

// // lst = LST(d, longitude, UT)
// // if (lst < 0) {lst+=(2*Math.PI)}

// // HA = lst - ra // degrees

// // var lat = rad*latitude
// // var lng = rad*longitude

// // console.log(lat, lng)

// // var PI   = Math.PI,
// //     sin  = Math.sin,
// //     cos  = Math.cos,
// //     tan  = Math.tan,
// //     asin = Math.asin,
// //     atan = Math.atan2,
// //     acos = Math.acos,
// //     rad  = PI / 180;

// // alt = asin(sin(dec)*sin(lat)+cos(dec)*cos(lat)*cos(HA))
// // A = acos((sin(dec) - sin(alt)*sin(lat))/(cos(alt)*cos(lat)))

// // date = new Date(1998, 8, 10, 23, 10)

// // lat = (52 + 30/60) // degrees
// // lng = -(1 + 55/60) // degrees

// var PI   = Math.PI,
//     sin  = Math.sin,
//     cos  = Math.cos,
//     tan  = Math.tan,
//     asin = Math.asin,
//     atan = Math.atan2,
//     acos = Math.acos,
//     rad  = PI / 180;

// var dayMs = 1000 * 60 * 60 * 24,
//     J1970 = 2440588,
//     J2000 = 2451545;

// function toJulian(date) { return date.valueOf() / dayMs - 0.5 + J1970; }
// function toDays(date)   { return toJulian(date) - J2000; }

// function toDate(d)      { return d + J2000}

// function siderealTime(d, lw) { return rad * (280.16 + 360.9856235 * d) - lw; }
// function altitude(H, phi, dec) { return asin(sin(phi) * sin(dec) + cos(phi) * cos(dec) * cos(H)); }

// var lw  = rad * -lng,
//     phi = rad * lat,
//     d   = toDays(date),  
//     H = siderealTime(d, lw) - ra,
//     h = altitude(H, phi, dec);


// function test(H, lw) { return ((H + lw) / rad - 280.16) / 360.9856235; }


// t = Math.acos(-Math.tan(dec)*Math.tan(phi))

// // H = rad * (280.16 + 360.9856235 * d) - lw
// // H + lw = rad * (280.16 + 360.9856235 * d)
// // (H + lw) / rad = 280.16 + 360.9856235 * d
// // (H + lw) / rad - 280.16 = 360.9856235 * d
// // d = ((H + lw) / rad - 280.16) / 360.9856235

// // h = 0 ==> sin(phi) * sin(dec) + cos(phi) * cos(dec) * cos(H) = 0
// // ==> cos(H) = -sin(phi) * sin(dec) / (cos(phi) * cos(dec))
// // ==> H = acos(-tan(phi)*tan(dec))