let drawState = {
    skyColors: {
            'nightSky': '#000026',
            'darkSky' : '#2c0b4d',
            'twilight': '#733973',
            'riseSet': '#b35071',
            'goldenHour': '#ffcc73',
            'daySky': '#ffff73'
    },
    gcColors: {
        'nightSky': '#f1ebd3',
        'darkSky' : '#7b6583',
        'twilight': '#8c5d86',
        'riseSet': '#b9607b',
        'goldenHour': '#febe7d',
        'daySky': '#ffff73'
    },
    nowColors: {
        'nightSky': 'white',
        'darkSky' : 'white',
        'twilight': 'white',
        'riseSet': 'white',
        'goldenHour': 'black',
        'daySky': 'black'
    }
};
drawState.sunColor = {
    'nadir': drawState.skyColors.nightSky,
    'nightEnd': drawState.skyColors.darkSky,
    'nauticalDawn': drawState.skyColors.twilight,
    'dawn': drawState.skyColors.riseSet,
    'sunrise': drawState.skyColors.riseSet,
    'sunriseEnd': drawState.skyColors.goldenHour,
    'goldenHourEnd': drawState.skyColors.daySky,

    'solarNoon': drawState.skyColors.daySky,
    'goldenHour': drawState.skyColors.goldenHour,
    'sunsetStart': drawState.skyColors.riseSet,
    'sunset': drawState.skyColors.riseSet,
    'dusk': drawState.skyColors.twilight,
    'nauticalDusk': drawState.skyColors.darkSky,
    'night': drawState.skyColors.nightSky
};    

const state = initializeState();
const layout = initializeLayout();

d3.select('#latitude')
    .property('value', state.latitude.toFixed(4))
    .on('change', function() {
        setState({latitude: d3.select(this).property('value')});
        draw();
    })

d3.select('#longitude')
    .property('value', state.longitude.toFixed(4))
    .on('change', function() {
        setState({longitude: d3.select(this).property('value')});
        draw();
    })

d3.select('#date')
    .property('value', state.date.toISO().slice(0,10))
    .on('change', function() {
        let newDate = d3.select(this).property('value')
        setState({date: newDate})
        draw();
    })
d3.select('#tzInfo').text(`Timezone: ${state.tz}`)

draw();

function setState(obj) {
    if (obj.latitude) {
        state.latitude = obj.latitude; 
        d3.select('#latitude').property('value', obj.latitude)
        d3.select('#tzInfo').text(state.tz)
    }
    if (obj.longitude) {
        state.longitude = obj.longitude;
        d3.select('#longitude').property('value', obj.longitude)
        d3.select('#tzInfo').text(`Timezone: ${state.tz}`)
    }
    if (obj.date) {
        state.date = obj.date;
        d3.select('#date').property('value', obj.date)
    }
}

function initializeState() {
    const state = {
        latitude: 41.8781,
        longitude: -87.6298,
        get tz() {
            return tzlookup(this.latitude, this.longitude)
        },
        get date() {
            return DateTime.fromObject({
                year: this.year,
                month: this.month,
                day: this.day,
                zone: this.tz
            })
        },
        set date(str) {
            let dt = DateTime.fromISO(str, {zone: this.tz});
            this.year = dt.year,
            this.month = dt.month,
            this.day = dt.day
        },
        get startTime() {
            return this.date.set({hour: 12})
        },
        get endTime() {
            return this.startTime.plus({hours: 24})
        }
    }

    state.date = DateTime.local().setZone(state.tz)

    return state;
}

function initializeLayout() {
    const layout = {
        height: 200,
        width: 960,
        margin: {
            top: 0,
            right: 20,
            bottom: 20,
            left: 20    
        },
        get chartHeight() {
            return this.height - this.margin.top - this.margin.bottom;
        },
        get chartWidth() {
            return this.width - this.margin.left - this.margin.right;
        }
    }
 
    layout.chartSvg = d3.select("#chartSvg")
        .attr('height', layout.height)
        .attr('width', layout.width)

    layout.chartSvg.append('mask')
        .attr('id', 'chartMask')
        .append('rect')
        .attr('width', layout.chartWidth)
        .attr('height', layout.chartHeight)
        .attr('fill', 'white')

    layout.g = layout.chartSvg.append('g')
        .attr('transform', `translate(${layout.margin.left},${layout.margin.top})`)

    layout.maskedG = layout.chartSvg.append('g')
        .attr('mask', 'url(#chartMask)')
        .attr('transform', `translate(${layout.margin.left},${layout.margin.top})`)

    layout.legend = d3.select('legend')

    layout.legend.html('')
    layout.legend.append('div').text('Legend: ')
    layout.legend.selectAll('item').data(Object.entries(drawState.skyColors))
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

    layout.legendDiameter = 32
    let legendDiameter = 32
    let phase = SunCalc.getMoonIllumination(state.startTime).phase

    layout.legend.append('item').text('Moon:').style('margin-right', 0).style('float', 'left')

    layout.legendMoonSvg = d3.select('legend').append('svg')
        .attr('width', legendDiameter)
        .attr('height', legendDiameter)
        .style('float', 'left')

    layout.legendMoonSvg.append('circle')
        .attr('cx', 0.5*legendDiameter)
        .attr('cy', 0.5*legendDiameter)
        .attr('r', 0.5*legendDiameter)
        .attr('fill', '#DDD')

    layout.legendMoonSvg.append('path')
        .attr('d', d => `M0 ${-0.5*legendDiameter}` + 
                        `c${(2*phase % 1 - 0.5) * legendDiameter * 4/3} 0, ${(2*phase % 1 - 0.5) * legendDiameter * 4/3} ${legendDiameter}, 0 ${legendDiameter} ` +
                        `c${(phase > 0.5 ? -1 : 1) * legendDiameter * 2/3} 0, ${(phase > 0.5 ? -1 : 1) * legendDiameter * 2/3} ${-legendDiameter}, 0 ${-legendDiameter}`)
        .attr('transform', `translate(${0.5*legendDiameter},${0.5*legendDiameter})`)
        .attr('fill', '#222')

    layout.legend.append('item').text('Galactic center:').style('margin-right', 0)

    gcSvg = d3.select('legend').append('svg')
        .attr('width', legendDiameter)
        .attr('height', legendDiameter)
        .style('float', 'left')

    gcSvg.append('rect')
        .attr('width', legendDiameter)
        .attr('height', legendDiameter)
        .attr('fill', drawState.skyColors['nightSky'])

    gcSvg.append('line')
        .attr('x1', 0.2*legendDiameter)
        .attr('x2', 0.8*legendDiameter)
        .attr('y1', 0.3*legendDiameter)
        .attr('y2', 0.7*legendDiameter)
        .attr('stroke', drawState.gcColors['nightSky'])

    gcSvg.append('circle')
        .attr('cx', 0.5*legendDiameter)
        .attr('cy', 0.5*legendDiameter)
        .attr('r', 2)
        .attr('fill', drawState.gcColors['nightSky'])

    if ('geolocation' in navigator) {
        d3.select("#locationButton").append('button')
            .attr('id', 'getLocation')
            .text("Get My Location")
            .on('click', () => {
                navigator.geolocation.getCurrentPosition((position) => {
                    latitude = position.coords.latitude;
                    longitude = position.coords.longitude;
                    setState({latitude: latitude.toFixed(4), longitude: longitude.toFixed(4)})        
                    draw();
                })
            })
    }
    return layout;
}

function plotSunAndGC() {
    let sunTimes = []
    sunTimes.push(SunCalc.getTimes(state.startTime, state.latitude, state.longitude))
    sunTimes.push(SunCalc.getTimes(state.endTime, state.latitude, state.longitude))

    drawState.sunColor = {
        'nadir': drawState.skyColors.nightSky,
        'nightEnd': drawState.skyColors.darkSky,
        'nauticalDawn': drawState.skyColors.twilight,
        'dawn': drawState.skyColors.riseSet,
        'sunrise': drawState.skyColors.riseSet,
        'sunriseEnd': drawState.skyColors.goldenHour,
        'goldenHourEnd': drawState.skyColors.daySky,

        'solarNoon': drawState.skyColors.daySky,
        'goldenHour': drawState.skyColors.goldenHour,
        'sunsetStart': drawState.skyColors.riseSet,
        'sunset': drawState.skyColors.riseSet,
        'dusk': drawState.skyColors.twilight,
        'nauticalDusk': drawState.skyColors.darkSky,
        'night': drawState.skyColors.nightSky
    }

    drawState.gcColors = {
        'nightSky': '#f1ebd3',
        'darkSky' : '#7b6583',
        'twilight': '#8c5d86',
        'riseSet': '#b9607b',
        'goldenHour': '#febe7d',
        'daySky': '#ffff73'
    }

    function gcColor(time) {
        let sunTimes = flatSunTimes.filter(x => x.time < time)
        let type = sunTimes[sunTimes.length - 1].type

        let colorTypes = {
            'nadir': drawState.gcColors.nightSky,
            'nightEnd': drawState.gcColors.darkSky,
            'nauticalDawn': drawState.gcColors.twilight,
            'dawn': drawState.gcColors.riseSet,
            'sunrise': drawState.gcColors.riseSet,
            'sunriseEnd': drawState.gcColors.goldenHour,
            'goldenHourEnd': drawState.gcColors.daySky,

            'solarNoon': drawState.gcColors.daySky,
            'goldenHour': drawState.gcColors.goldenHour,
            'sunsetStart': drawState.gcColors.riseSet,
            'sunset': drawState.gcColors.riseSet,
            'dusk': drawState.gcColors.twilight,
            'nauticalDusk': drawState.gcColors.darkSky,
            'night': drawState.gcColors.nightSky
        }

        return colorTypes[type]
    }

    function nowColor(time) {
        let sunTimes = flatSunTimes.filter(x => x.time < time)
        let type = sunTimes[sunTimes.length - 1].type

        let colorTypes = {
            'nadir': drawState.nowColors.nightSky,
            'nightEnd': drawState.nowColors.darkSky,
            'nauticalDawn': drawState.nowColors.twilight,
            'dawn': drawState.nowColors.riseSet,
            'sunrise': drawState.nowColors.riseSet,
            'sunriseEnd': drawState.nowColors.goldenHour,
            'goldenHourEnd': drawState.nowColors.daySky,

            'solarNoon': drawState.nowColors.daySky,
            'goldenHour': drawState.nowColors.goldenHour,
            'sunsetStart':drawState. nowColors.riseSet,
            'sunset': drawState.nowColors.riseSet,
            'dusk': drawState.nowColors.twilight,
            'nauticalDusk': drawState.nowColors.darkSky,
            'night': drawState.nowColors.nightSky
        }

        return colorTypes[type]
    }

    let xScale = drawState.xScale
    let yScale = drawState.yScale

    flatSunTimes = [].concat.apply([], sunTimes.map(x => Object.entries(x)))
        .map(x => {return {'time':x[1], 'type':x[0]}; })
        .sort((a, b) => a.time.valueOf() - b.time.valueOf())
        .filter(x => !isNaN(x.time) && x.type !== 'nadir' && x.type !== 'sunrise' && x.type !== 'sunset')

    daylightStarts = flatSunTimes.filter(x => (x.type == 'goldenHourEnd' && x.time >= state.startTime))
    daylightEnds = flatSunTimes.filter(x => (x.type == 'goldenHour' && x.time < state.endTime))

    let sunBlockTimes = []

    for (let i = 0; i < flatSunTimes.length - 1; i++) {
        let block = [flatSunTimes[i], flatSunTimes[i+1]]
        if (flatSunTimes[i].time < state.endTime) sunBlockTimes.push(block);
    }

    layout.maskedG.selectAll('.sunBlock').data(sunBlockTimes)
            .enter()
            .append('rect')
            .attr('x', d => Math.floor(xScale(d[0].time)))
            .attr('y', 0)
            .attr('width', d => Math.ceil(xScale(Math.min(d[1].time, state.endTime)) - xScale(Math.min(d[0].time))))
            .attr('height', layout.chartHeight)
            .attr('fill', d => drawState.sunColor[d[0].type])

    let now = new Date()
    layout.maskedG.append('line')
        .attr('x1', xScale(now))
        .attr('x2', xScale(now))
        .attr('y1', 0)
        .attr('y2', layout.chartHeight)
        .attr('stroke', nowColor(now))

    let galaxyLineRadius = 0.5

    let gcPositions = []

    layout.maskedG.selectAll('.gcPosition').data(gcPositions)
        .enter()
    .append('line')
        .attr('x1', d => xScale(d.time) + galaxyLineRadius*(d.position0.azimuth - d.position1.azimuth) / ((d.position0.azimuth - d.position1.azimuth)**2 + (d.position0.altitude - d.position1.altitude)**2) )
        .attr('x2', d => xScale(d.time) - galaxyLineRadius*(d.position0.azimuth - d.position1.azimuth) / ((d.position0.azimuth - d.position1.azimuth)**2 + (d.position0.altitude - d.position1.altitude)**2) )
        .attr('y1', d => yScale(d.position0.altitude) - galaxyLineRadius*(d.position0.altitude - d.position1.altitude) / ((d.position0.azimuth - d.position1.azimuth)**2 + (d.position0.altitude - d.position1.altitude)**2) )
        .attr('y2', d => yScale(d.position1.altitude) + galaxyLineRadius*(d.position0.altitude - d.position1.altitude) / ((d.position0.azimuth - d.position1.azimuth)**2 + (d.position0.altitude - d.position1.altitude)**2) )
        .attr('stroke', d => gcColor(d.time))

    layout.maskedG.selectAll('.gcPosition').data(gcPositions)
        .enter()
    .append('circle')
        .attr('cx', d => xScale(d.time))
        .attr('cy', d => yScale(d.position.altitude))
        .attr('r', 2)
        .attr('fill', d => gcColor(d.time))


    for (let i = 0; i < state.endTime.valueOf() - state.startTime.valueOf(); i += (state.endTime.valueOf() - state.startTime.valueOf())/75) {
        let time = new Date(state.startTime.valueOf() + i )       
        let position0 = SunCalc.getStarPosition(time, state.latitude, state.longitude, (17 + 47/60 + 58.9/3600), -(28 + 4/60  + 53/3600))
        let position =  SunCalc.getStarPosition(time, state.latitude, state.longitude, (17 + 45/60 + 37.2/3600), -(28 + 56/60 + 10/3600))
        let position1 = SunCalc.getStarPosition(time, state.latitude, state.longitude, (17 + 43/60 + 13.1/3600), -(29 + 47/60 + 18/3600))
        let result = {}
        result.time = time
        result.position0 = position0
        result.position = position
        result.position1 = position1
        if (position.altitude > 0) gcPositions.push(result)
    }

    layout.maskedG.selectAll('.gcPosition').data(gcPositions)
        .enter()
    .append('line')
        .attr('x1', d => xScale(d.time) + galaxyLineRadius*(d.position0.azimuth - d.position1.azimuth) / ((d.position0.azimuth - d.position1.azimuth)**2 + (d.position0.altitude - d.position1.altitude)**2) )
        .attr('x2', d => xScale(d.time) - galaxyLineRadius*(d.position0.azimuth - d.position1.azimuth) / ((d.position0.azimuth - d.position1.azimuth)**2 + (d.position0.altitude - d.position1.altitude)**2) )
        .attr('y1', d => yScale(d.position0.altitude) - galaxyLineRadius*(d.position0.altitude - d.position1.altitude) / ((d.position0.azimuth - d.position1.azimuth)**2 + (d.position0.altitude - d.position1.altitude)**2) )
        .attr('y2', d => yScale(d.position1.altitude) + galaxyLineRadius*(d.position0.altitude - d.position1.altitude) / ((d.position0.azimuth - d.position1.azimuth)**2 + (d.position0.altitude - d.position1.altitude)**2) )
        .attr('stroke', d => gcColor(d.time))

    layout.maskedG.selectAll('.gcPosition').data(gcPositions)
        .enter()
    .append('circle')
        .attr('cx', d => xScale(d.time))
        .attr('cy', d => yScale(d.position.altitude))
        .attr('r', 2)
        .attr('fill', d => gcColor(d.time))

    // workaround to show axis in local time
    xAxisScale = d3.scaleTime().domain([new Date(state.year, state.month, state.day, 12, 0, 0), new Date(state.year, state.month, state.day + 1, 12, 0, 0)]).range([0, layout.chartWidth])
    xAxis = d3.axisBottom(xAxisScale)

    layout.g.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0, ${layout.chartHeight})`)
        .call(xAxis)

    layout.maskedG.append('rect')
        .attr('width', layout.chartWidth)
        .attr('height', layout.chartHeight)
        .attr('fill', 'none')
        .attr('stroke', 'black')
}

function plotGridline() {
    let xScale = drawState.xScale
    let xAxisGrid = d3.axisBottom(xScale).ticks(d3.utcHour.every(1)).tickSize(layout.chartHeight)
    layout.maskedG.append('g')
        .attr('class', 'x axis-grid')
        .call(xAxisGrid)
}

function plotMoonPositions() {
    let moonPositions = []
    let moonDiameter = 10
    phase = SunCalc.getMoonIllumination(state.startTime).phase

    let xScale = drawState.xScale
    let yScale = drawState.yScale


    for (let i = 0; i < state.endTime.valueOf() - state.startTime.valueOf(); i += (state.endTime.valueOf() - state.startTime.valueOf())/75) {
        let time = new Date(state.startTime.valueOf() + i )       
        let moonPosition = SunCalc.getMoonPosition(time, state.latitude, state.longitude)
        moonPosition.time = time
        if (moonPosition.altitude > 0) moonPositions.push(moonPosition)
    }

    layout.maskedG.selectAll('.moonPosition').data(moonPositions)
        .enter()
    .append('circle')
        .attr('cx', d => xScale(d.time))
        .attr('cy', d => yScale(d.altitude))
        .attr('r', 0.5*moonDiameter)
        .attr('fill', '#DDD')

    layout.maskedG.selectAll('.moonPosition').data(moonPositions)
        .enter()
    .append('path')
        .attr('d', d => `M0 ${-0.5*moonDiameter} c${(2*phase % 1 - 0.5) * moonDiameter * 4/3} 0, ${(2*phase % 1 - 0.5) * moonDiameter * 4/3} ${moonDiameter}, 0 ${moonDiameter} c${(phase > 0.5 ? -1 : 1) * moonDiameter * 2/3} 0, ${(phase > 0.5 ? -1 : 1) * moonDiameter * 2/3} ${-moonDiameter}, 0 ${-moonDiameter}`)
        .attr('transform', d => `translate(${xScale(d.time)},${yScale(d.altitude)})`)
        .attr('fill', '#222')

    let legendDiameter = layout.legendDiameter

    layout.legendMoonSvg.selectAll('*').remove()

    layout.legendMoonSvg.append('circle')
        .attr('cx', 0.5*legendDiameter)
        .attr('cy', 0.5*legendDiameter)
        .attr('r', 0.5*legendDiameter)
        .attr('fill', '#DDD')

    layout.legendMoonSvg.append('path')
        .attr('d', d => `M0 ${-0.5*legendDiameter}` + 
                        `c${(2*phase % 1 - 0.5) * legendDiameter * 4/3} 0, ${(2*phase % 1 - 0.5) * legendDiameter * 4/3} ${legendDiameter}, 0 ${legendDiameter} ` +
                        `c${(phase > 0.5 ? -1 : 1) * legendDiameter * 2/3} 0, ${(phase > 0.5 ? -1 : 1) * legendDiameter * 2/3} ${-legendDiameter}, 0 ${-legendDiameter}`)
        .attr('transform', `translate(${0.5*legendDiameter},${0.5*legendDiameter})`)
        .attr('fill', '#222')
}

function draw() {
    drawState.xScale = d3.scaleUtc().domain([state.startTime, state.endTime]).range([0, layout.chartWidth])
    drawState.yScale = d3.scaleLinear().domain([0, Math.PI/2]).range([layout.chartHeight, 0])

    layout.g.html('')
    layout.maskedG.html('')

    plotSunAndGC();
    plotGridline();
    plotMoonPositions();
}