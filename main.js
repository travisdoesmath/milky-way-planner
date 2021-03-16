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

times = {}

sunTimes = [yesterday, today, tomorrow].map(x => SunCalc.getTimes(x, latitude, longitude))
moonTimes = [yesterday, today, tomorrow].map(x => SunCalc.getMoonTimes(x, latitude, longitude))
galacticCenterTimes = [yesterday, today, tomorrow].map(x => SunCalc.getGalacticCenterTimes(x, latitude, longitude))

todayNightStart = SunCalc.getTimes(now, latitude, longitude).night
todayNightEnd = SunCalc.getTimes(now, latitude, longitude).nightEnd

isNight = now > todayNightStart || now < todayNightEnd
console.log(`Is it night? ${isNight ? 'yes' : 'no'}`)

if (!isNight) {
    nightStart = todayNightStart
    nightEnd = SunCalc.getTimes(tomorrow, latitude, longitude).nightEnd
    moontimes = SunCalc.getMoonTimes(now, latitude, longitude)
    console.log(nightStart, nightEnd, moontimes)
} else {
    // figure out later
}


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
    sunBlockTimes.push(block)
}

let startTime = new Date()
startTime.setMinutes(Math.floor(startTime.getMinutes() / 15)*15, 0)
let endTime = new Date()
endTime.setHours(0, 0, 0)
endTime.setDate(endTime.getDate() + 2)


let height = 100;
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

const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)

xScale = d3.scaleTime().domain([startTime, endTime]).range([0, chartWidth])
yScale = d3.scaleLinear().domain([0, Math.PI/4]).range([chartHeight, 0])

xAxis = d3.axisBottom(xScale)

sunColor = {
    'nadir':'#000',
    'nightEnd':'#41295b',
    'nauticalDawn':'#824566',
    'dawn':'#cc617f',
    'sunrise':'#ef818a',
    'sunriseEnd':'#fddb70',
    'goldenHourEnd':'#fffe77',
    'solarNoon':'#fffe77',
    'goldenHour':'#fddb70',
    'sunsetStart':'#ef818a',
    'sunset':'#cc617f',
    'dusk':'#824566',
    'nauticalDusk':'#41295b',
    'night':'#000'
}

sunBlocks = g.selectAll('.sunBlock').data(sunBlockTimes)
    .enter()
    .append('rect')
    .attr('x', d => Math.floor(xScale(d[0].time)))
    .attr('y', 0)
    .attr('width', d => Math.ceil(xScale(d[1].time) - xScale(d[0].time)))
    .attr('height', chartHeight)
    .attr('fill', d => sunColor[d[0].type])


g.append('g')
 .attr('class', 'x-axis')
 .attr('transform', `translate(0, ${chartHeight})`)
 .call(xAxis)

let gcPositions = []

for (let i = 0; i < endTime.valueOf() - startTime.valueOf(); i += 15*60*1000) {
    let time = new Date(startTime.valueOf() + i )
    let position = SunCalc.getGCPosition(time, latitude, longitude)
    position.time = time
    if (position.altitude > 0) gcPositions.push(position)
}

g.selectAll('.gcPosition').data(gcPositions)
    .enter()
    .append('circle')
    .attr('cx', d => xScale(d.time))
    .attr('cy', d => yScale(d.altitude))
    .attr('r', 1)
    .attr('fill', '#fffe77')


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