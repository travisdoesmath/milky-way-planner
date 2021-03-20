let latitude = 41.8781 
let longitude = -87.6298 
let now = new Date()
setState({now: now, latitude: latitude, longitude: longitude})
drawChart();

if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition((position) => {
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;

        setState({latitude: latitude, longitude: longitude})        
        drawChart();
    })
}

function setState(obj) {
    if (obj.now) {
        now = obj.now;
        d3.select('#startTime').property('value', obj.now.toISOString().substring(0, now.toISOString().length - 1))
    }
    if (obj.latitude) {
        latitude = obj.latitude; 
        d3.select('#latitude').property('value', obj.latitude)
    }
    if (obj.longitude) {
        longitude = obj.longitude;
        d3.select('#longitude').property('value', obj.longitude)
    }
}

function drawChart() {
    console.log('draw')
    now = new Date(d3.select('#startTime').property('value') + 'Z')
    latitude = +d3.select('#latitude').property('value')
    longitude = +d3.select('#longitude').property('value')

    let startTime = new Date(now)
    startTime.setDate(now.getDate())
    startTime.setMinutes(Math.floor(startTime.getMinutes() / 15)*15, 0)

    let endTime = new Date(now)
    endTime.setDate(now.getDate() + 1)
    endTime.setHours(12, 0, 0)

    console.log('startTime', startTime)
    console.log('endTime', endTime)

    yesterday = new Date(now)
    yesterday.setDate(now.getDate() - 1)
    yesterday.setHours(12,0,0)
    today = new Date(now)
    today.setHours(12,0,0)
    tomorrow = new Date(now)
    tomorrow.setDate(now.getDate() + 1)
    tomorrow.setHours(12,0,0)

    d3.select('#startTime')
        .property('value', now.toISOString().substring(0, now.toISOString().length - 8))
        .on('change', function() {
            setState({now: new Date(d3.select(this).property('value')+'Z')});
            drawChart();
        })
    let tzOffset = now.getTimezoneOffset()
    d3.select('#tzInfo').text(`(UTC) Your current timezone: ${tzOffset > 0 ? '-':'+'}${new Date(now.getTimezoneOffset() * 1000).toISOString().substr(14, 5)}`)
    d3.select('#latitude')
        .property('value', latitude.toFixed(4))
        .on('change', function() {
            setState({latitude: d3.select(this).property('value')});
            drawChart();
        })

    d3.select('#longitude')
        .property('value', longitude.toFixed(4))
        .on('change', function() {
            setState({longitude: d3.select(this).property('value')});
            drawChart();
        })





    sunTimes = [yesterday, today, tomorrow].map(x => SunCalc.getTimes(x, latitude, longitude))
    moonTimes = [yesterday, today, tomorrow].map(x => SunCalc.getMoonTimes(x, latitude, longitude))
    galacticCenterTimes = [yesterday, today, tomorrow].map(x => SunCalc.getGalacticCenterTimes(x, latitude, longitude))

    moonTimes = []
    sunTimes = []
    gcTimes = []

    for (let i = -1; i <= 2; i++) {
        day = new Date(now)
        day.setDate(today.getDate() + i)
        day.setHours(12, 0, 0)
        moonTimes.push(SunCalc.getMoonTimes(day, latitude, longitude))
        //sunTime = SunCalc.getTimes(day, latitude, longitude)
        //sunTimes.push({'night': sunTime.night, 'nightEnd':sunTime.nightEnd})
        sunTimes.push(SunCalc.getTimes(day, latitude, longitude))
        gcTimes.push(SunCalc.getGalacticCenterTimes(day, latitude, longitude))
    }

    // flatMoonTimes = [].concat.apply([], moonTimes.map(x => Object.entries(x)))
    //     .map(x => {return {'time':x[1], 'type':x[0]}; })
    //     .sort((a, b) => a.time.valueOf() - b.time.valueOf())
    //     .filter(x => !isNaN(x.time) && x.type !== 'nadir')
    // flatGCTimes = [].concat.apply([], gcTimes.map(x => Object.entries(x))).map(x => {return {'time':x[1], 'type':x[0]}; }).sort((a, b) => a.time.valueOf() - b.time.valueOf()).filter(x => !isNaN(x.time))


    flatSunTimes = [].concat.apply([], sunTimes.map(x => Object.entries(x)))
        .map(x => {return {'time':x[1], 'type':x[0]}; })
        .sort((a, b) => a.time.valueOf() - b.time.valueOf())
        .filter(x => !isNaN(x.time) && x.type !== 'nadir')

    sunBlockTimes = []

    for (let i = 0; i < flatSunTimes.length - 1; i++) {
        let block = [flatSunTimes[i], flatSunTimes[i+1]]
        if (flatSunTimes[i].time < endTime) sunBlockTimes.push(block);
    }

    let height = 200;
    let width = 960;

    let margin = {
        top: 0,
        right: 20,
        bottom: 20,
        left: 0
    }

    let chartHeight = height - margin.top - margin.bottom;
    let chartWidth = width - margin.left - margin.right;

    const svg = d3.select("#chartSvg")
        .attr('height', height)
        .attr('width', width)

    const legend = d3.select('legend')

    svg.html('')

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
    xAxisGrid = d3.axisBottom(xScale).ticks(d3.utcHour.every(1)).tickSize(chartHeight)

    skyColors = {
        'nightSky': '#000026',
        'darkSky' : '#2c0b4d',
        'twilight': '#733973',
        'riseSet': '#b35071',
        'goldenHour': '#ffcc73',
        'daySky': '#ffff73'
    }

    legend.html('')
    legend.append('div').text('Legend: ')
    legend.selectAll('item').data(Object.entries(skyColors))
        .enter()
        .append('item')
        .style('background-color', d => d[1])
        .style('color', d => {
            if (d[0] == 'nightSky') return "white";
            if (d[0] == 'darkSky') return "white";
            if (d[0] == 'twilight') return "white";
            if (d[0] == 'riseSet') return "white";
            if (d[0] == 'goldenHour') return "black";
            if (d[0] == 'daySky') return "black";
        })
        .text(d => {
            if (d[0] == 'nightSky') return "Nighttime";
            if (d[0] == 'darkSky') return "Astronomical Twilight";
            if (d[0] == 'twilight') return "Nautical Twilight";
            if (d[0] == 'riseSet') return "Civil Twilight";
            if (d[0] == 'goldenHour') return "Golden Hour";
            if (d[0] == 'daySky') return "Daytime";
        })

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

    maskedG.append('g')
        .attr('class', 'x axis-grid')
        //.attr('transform', `translate(0,${chartHeight})`)
        .call(xAxisGrid)

    g.append('g')
    .attr('class', 'x-axis')
    .attr('transform', `translate(0, ${chartHeight})`)
    .call(xAxis)


    let moonPositions = []
    let gcPositions = []

    //for (let i = 0; i < endTime.valueOf() - startTime.valueOf(); i += 15*60*1000) {
    for (let i = 0; i < endTime.valueOf() - startTime.valueOf(); i += (endTime.valueOf() - startTime.valueOf())/75) {
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

    console.log("moonPositions", moonPositions)
    console.log("gcPositions", gcPositions)

    let galaxyLineRadius = 0.5

    maskedG.selectAll('.gcPosition').data(gcPositions)
        .enter()
    .append('line')
        .attr('x1', d => xScale(d.time) + galaxyLineRadius*(d.position0.azimuth - d.position1.azimuth) / ((d.position0.azimuth - d.position1.azimuth)**2 + (d.position0.altitude - d.position1.altitude)**2) )
        .attr('x2', d => xScale(d.time) - galaxyLineRadius*(d.position0.azimuth - d.position1.azimuth) / ((d.position0.azimuth - d.position1.azimuth)**2 + (d.position0.altitude - d.position1.altitude)**2) )
        // .attr('x2', d => xScale(d.time) + 5)
        .attr('y1', d => yScale(d.position0.altitude) - galaxyLineRadius*(d.position0.altitude - d.position1.altitude) / ((d.position0.azimuth - d.position1.azimuth)**2 + (d.position0.altitude - d.position1.altitude)**2) )
        .attr('y2', d => yScale(d.position1.altitude) + galaxyLineRadius*(d.position0.altitude - d.position1.altitude) / ((d.position0.azimuth - d.position1.azimuth)**2 + (d.position0.altitude - d.position1.altitude)**2) )
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
        .attr('d', d => `M0 ${-0.5*moonDiameter} c${(2*phase % 1 - 0.5) * moonDiameter * 4/3} 0, ${(2*phase % 1 - 0.5) * moonDiameter * 4/3} ${moonDiameter}, 0 ${moonDiameter} c${(phase > 0.5 ? -1 : 1) * moonDiameter * 2/3} 0, ${(phase > 0.5 ? -1 : 1) * moonDiameter * 2/3} ${-moonDiameter}, 0 ${-moonDiameter}`)
        .attr('transform', d => `translate(${xScale(d.time)},${yScale(d.altitude)})`)
        .attr('fill', '#222')

    legendDiameter = 32

    d3.select('legend').append('item').text('Moon:').style('margin-right', 0).style('float', 'left')

    moonSvg = d3.select('legend').append('svg')
        .attr('width', legendDiameter)
        .attr('height', legendDiameter)
        .style('float', 'left')

    moonSvg.append('circle')
        .attr('cx', 0.5*legendDiameter)
        .attr('cy', 0.5*legendDiameter)
        .attr('r', 0.5*legendDiameter)
        .attr('fill', '#DDD')

    moonSvg.append('path')
        .attr('d', d => `M0 ${-0.5*legendDiameter}` + 
                        `c${(2*phase % 1 - 0.5) * legendDiameter * 4/3} 0, ${(2*phase % 1 - 0.5) * legendDiameter * 4/3} ${legendDiameter}, 0 ${legendDiameter} ` +
                        `c${(phase > 0.5 ? -1 : 1) * legendDiameter * 2/3} 0, ${(phase > 0.5 ? -1 : 1) * legendDiameter * 2/3} ${-legendDiameter}, 0 ${-legendDiameter}`)
        .attr('transform', `translate(${0.5*legendDiameter},${0.5*legendDiameter})`)
        .attr('fill', '#222')

    d3.select('legend').append('item').text('Galactic center:').style('margin-right', 0)

    gcSvg = d3.select('legend').append('svg')
        .attr('width', legendDiameter)
        .attr('height', legendDiameter)
        .style('float', 'left')

    gcSvg.append('rect')
        .attr('width', legendDiameter)
        .attr('height', legendDiameter)
        .attr('fill', skyColors['nightSky'])

    gcSvg.append('line')
        .attr('x1', 0.2*legendDiameter)
        .attr('x2', 0.8*legendDiameter)
        .attr('y1', 0.3*legendDiameter)
        .attr('y2', 0.7*legendDiameter)
        .attr('stroke', gcColors['nightSky'])

    gcSvg.append('circle')
        .attr('cx', 0.5*legendDiameter)
        .attr('cy', 0.5*legendDiameter)
        .attr('r', 2)
        .attr('fill', gcColors['nightSky'])


}

