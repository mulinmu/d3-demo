const allLevel = 6
const gapOfRow =  80
const gapOfLevel = 120
const leaveOfRowLength = 20
const leaveFontSize = 16
const leaveColor = 'rgb(18, 139, 64)'
const transitionNum = 5
const transitionInterval = 200
const rectHeight = 50
const pathColor = '#ccc'
const leaveTextColor = '#fff'
const rectColor = 'orange'

/*
* 调用 new Container(svg,option).render();
* */
class Container {
    constructor(svg, option){
        this.svg = d3.select(svg)
        this.data = option
    }

    // 主渲染方法
    render(){
        this.clearScene()
        this.initScene()
        this.computedScene()
        this.drawScene()
    }

    // 清除旧的场景
    clearScene(){
        this.svg.selectAll('*').remove()
    }

    // 初始化场景
    initScene(){
        const data = this.data
        let width = this.svg.attr('width');
        let height = this.svg.attr('height');
        this.width = width
        this.height = height
        let svg = this.svg
          .append('svg')
          .attr('width', width)
          .attr('height', height)
          .append('g')
        this.svg = svg
          .append('g') // 移动时减少抖动
        svg.attr('transform',  "translate(" + 0 + "," + 10 + ")")
          .call(d3.zoom()
            .scaleExtent([0.5, 1.5])
            .on('zoom',() => {
              this.svg.attr("transform", d3.event.transform )
            }))
            .on('dblclick.zoom', null)
    }

    // 计算节点位置
    computedScene(){
        this.computedBubbles()
        this.computedLeaves()
    }

    // 计算Bubbles节点位置
    computedBubbles(){
        const data = this.data
        const bubblesX = this.width / 2
        this.bubblesX = bubblesX
        let index1 = 0
        let index2 = 0
        if(this.data[0].to.length){
          index2 = this.computedLevel(this.data[0].to, this.width)
        }
        if(this.data[0].from.length){
          index1 = this.computedLevel(this.data[0].from, this.width)
        }
        let bubblesY = 0
        if(index1 !== 0 && index2 !== 0){
          if(index1 + index2 <= allLevel){
            bubblesY = (index1 -1) * gapOfRow  + gapOfLevel
          }
          if(index1 + index2 > allLevel && index1 >= allLevel / 2){
            if(index2 >= 3){
              bubblesY = 2 * gapOfRow + gapOfLevel
            }else {
              bubblesY = (allLevel - index2) * gapOfRow + gapOfLevel
            }
          }
          if(index1 + index2 >allLevel && index1 <= allLevel / 2){
            bubblesY = (index1 -1) * gapOfRow + gapOfLevel
          }
        }else if(index1 === 0){
          bubblesY = 0
        }else {
          bubblesY = (index1 -1) * gapOfRow  + gapOfLevel
        }
        this.bubblesY = bubblesY
        this.bubbles = {}
        data.forEach((val, i) => {
          this.bubbles[val.leave] = {
            cx: bubblesX,
            cy: bubblesY,
            draw: false,
            index: i,
          }
        })
    }
    // 计算节点位置
    computedLeaves(){
        const data = this.data
        let currentLeaveIndex = 0
        this.leaves = []
        const bubblesX = this.bubblesX
        console.log(bubblesX)
        let upData = {}, downData = {}
        if(this.data[0].to.length){
          downData = this.computedCoorOther(this.data[0].to, {x : bubblesX, y: this.bubblesY },  this.width, 'down')
        }
        if(this.data[0].from.length){
          upData= this.computedCoorOther(this.data[0].from,  {x : bubblesX, y: this.bubblesY },this.width, 'up')
        }
        let index1 = 0
        let index2 = 0
        if(Object.keys(upData).length){
          let maxUp = Object.keys(upData).map( v => {
            return upData[v].level || 0
          })
          index1 =Math.max(...maxUp)
        }
        if(Object.keys(downData).length){
          let maxDown = Object.keys(downData).map( v => {
            return downData[v].level || 0
          })
          index2 = Math.max(...maxDown)
        }
        let maxIndex1 = 0
        let maxIndex2 = 0
        if(index1 + index2 <= 6){
          maxIndex1 = index1
          maxIndex2 = index2
        }else if(index1 + index2 > 6){
          if(index2 <= 3){
            maxIndex1 = 6 - index2
            maxIndex2 = index2
          }else if(index1 <= 3){
            maxIndex1 = index1
            maxIndex2 = 6 - index1
          }else {
            maxIndex1 = 3
            maxIndex2 = 3
          }
        }
        data[0].from.forEach((innerval, j) => {
          let leaveName = innerval.leave

          if(upData[leaveName].level > maxIndex1){
            return
          }

          this.leaves.push({
            leaveName: leaveName,
            actual_email: upData[leaveName].actual_email,
            type: 'from',
            computed: true,
            cx: upData[leaveName].x,
            cy: upData[leaveName].y,
            width: upData[leaveName].width,
            level: upData[leaveName].level,
            color: leaveColor,
            name: innerval.leave,
            bubbles: [data[0].leave],
            index: currentLeaveIndex,
            bubbleIndex: 0,
            bubbleLeaveIndex: j
          })
          currentLeaveIndex++
        })
        data[0].to.forEach((innerval, j) => {
          const leaveName = innerval.leave
          if(downData[leaveName].level > maxIndex2){
            return
          }

          this.leaves.push({
            leaveName: leaveName,
            computed: true,
            type: 'to',
            color: leaveColor,
            cx: downData[leaveName].x,
            cy: downData[leaveName].y,
            width: downData[leaveName].width,
            level: downData[leaveName].level,
            name: innerval.leave,
            bubbles: [data[0].leave],
            index: currentLeaveIndex,
            bubbleIndex: 1,
            bubbleLeaveIndex: j
          })
          currentLeaveIndex++
        })
    }

    // 计算父节点的水平位置
    computedLevel(data, length){
        let  result = {},numLength = length, leafLength = 0
        let  level = 1
        data.forEach((v) => {
          let leave = v.leave
          result[leave] = {}
          const svg = this.svg
          const leaveText = svg.selectAll('.leave-text')
            .data([leave])
            .enter()
          let text = leaveText.append('text')
            .attr('font-size', leaveFontSize)
            .attr('class', 'text4')
            .text(leave)
          let width = text.node().getComputedTextLength()
          let text1 = d3.select('.text4')
          text1.remove()
          let len = width
          numLength = numLength - len - leaveOfRowLength
          result[leave].level = level
          leafLength = leafLength + len + leaveOfRowLength
          if(numLength <= width){
            numLength = length
            leafLength = 0
            level++
          }
        })
        let index = 0
        let maxUp = Object.keys(result).map( v => {
          return result[v].level
        })
        index = Math.max(...maxUp)
        return index
    }

       // 计算叶子节点的位置
    computedCoorOther(data, parentNode, length, direction){
        let  result = {},numLength = length, leafLength = 0, oneResult = {}, totalLength = 0, oneWidth = 0
        let  level = 1
        data.forEach((v) => {
          let leave = v.leave
          result[leave] = {}
          const svg = this.svg
          const leaveText = svg.selectAll('.leave-text')
            .data([leave])
            .enter()
          let text = leaveText.append('text')
            .attr('font-size', leaveFontSize)
            .attr('class', 'text3')
            .text(leave)
          let width = text.node().getComputedTextLength()
          let text1 = d3.select('.text3')
          text1.remove()
          let len = width
          totalLength = totalLength + len
          numLength = numLength - len - leaveOfRowLength
          result[leave].x = leafLength
          if(direction === 'down'){
            result[leave].y = parentNode.y + gapOfLevel + (level -1) * gapOfRow
          }else {
            result[leave].y = parentNode.y - gapOfLevel - (level -1) * gapOfRow
          }
          result[leave].width = len
          result[leave].level = level
          leafLength = leafLength + len + leaveOfRowLength
          if(numLength <= width){
            numLength = length
            leafLength = 0
            level++
          }
        })
        if(level === 1){
          data.forEach( (v, i) => {
            let leave = v.leave
            oneResult[leave] = {}
            oneResult[leave].x = parentNode.x - totalLength / 2 + oneWidth
            oneResult[leave].level = level
            oneResult[leave].width = result[leave].width
            if(direction === 'down'){
              oneResult[leave].y = parentNode.y + gapOfLevel
            }else {
              oneResult[leave].y = parentNode.y - gapOfLevel
            }
            oneWidth =  result[leave].width + oneWidth + leaveOfRowLength
          })
          console.log(oneResult)
          return oneResult
        }else {
          console.log(result)
          return result
        }
    }

    // 绘制图形
    drawScene(){
        this.drawLines()
        this.drawLeaves()
        this.drawBubbles()
    }
    // 绘制连接线
    drawLines () {
        const data = this.data
        const leaves = this.leaves
        const bubbles = this.bubbles
        const svg = this.svg
        let defs = svg.append('defs')
        let arrowMarker = defs.append("marker")
          .attr("id","arrow")
          .attr("markerUnits","strokeWidth")
          .attr("markerWidth",12)
          .attr("markerHeight",12)
          .attr("viewBox","0 0 12 12")
          .attr("refX",6)
          .attr("refY",6)
          .attr("orient","auto")
        let arrow_path = "M2,2 L10,6 L2,10 L6,6 L2,2"
        arrowMarker.append("path")
          .attr("d",arrow_path)
          .attr("fill",pathColor)

        data.forEach((outerval, i) => {
          const bubbleName = outerval.leave
          const bubble = bubbles[bubbleName]
          const color = pathColor
          leaves.forEach((innerval, j) => {
            let leaveName = innerval.leaveName
            let leavex = innerval.cx + innerval.width / 2
            let leavey = innerval.cy
            let bubblex = bubble.cx
            let bubbley = bubble.cy
            const path = d3.path()
            if( innerval.bubbleIndex){
              path.moveTo(bubblex, bubbley + rectHeight)
              path.lineTo(leavex, leavey - 4)
            }else {
              if(leavex < this.width / 5){
                path.moveTo(leavex, leavey)
                path.lineTo(bubblex - 30, bubbley - 4)
              }
              if(leavex < 2 * this.width / 5 && leavex >= this.width / 5){
                path.moveTo(leavex, leavey)
                path.lineTo(bubblex - 20, bubbley - 4)
              }
              if(leavex < 3 * this.width / 5 && leavex >= 2 * this.width / 5){
                path.moveTo(leavex, leavey)
                path.lineTo(bubblex, bubbley)
              }
              if(leavex < 4 * this.width / 5 && leavex >= 3 * this.width / 5){
                path.moveTo(leavex, leavey)
                path.lineTo(bubblex + 20, bubbley - 4)
              }
              if(leavex >= 4 * this.width / 5){
                path.moveTo(leavex, leavey)
                path.lineTo(bubblex + 30, bubbley - 4)
              }
            }
            this.svg.append('path')
              .attr('d', path)
              .attr('fill', 'none')
              .transition()
              .duration(transitionInterval)
              .delay((d, i) => {
                return (innerval.index / transitionNum) * transitionInterval
              })
              .attr('stroke', pathColor)
              .attr('stroke-width', '1px')
              .attr('id', (d) => {
                return 'line_' + bubble.index + '_' + innerval.index
              })
              .attr("marker-end", (d) => {
                return 'url(#arrow)'
              })
          })
        })
    }

    // 绘制叶子节点
    drawLeaves () {
        const data = this.data
        const leaves = this.leaves
        const keys = Object.keys(leaves)
        const svg = this.svg
        const leave = svg.selectAll('.leaveleave')
          .data(leaves, function (d) {
            return d
          })
          .enter().append('g')
          .attr('class', 'leave')
          .attr('transform', (d) => {
            return `translate(${d.cx}, ${d.cy})`
          })
        leave.append('rect')
          .transition()
          .duration(transitionInterval)
          .delay((d, i) => {
            return d.index / transitionNum * transitionInterval
          })
          .attr('x', function(d) {
            return 0
          })
          .attr('y', function(d) {
            let dist = 0
            return dist
          })
          .attr('width', (d) => {
            return d.width + 8
          })
          .attr('height', rectHeight)
          .attr('fill', leaveColor)
          .attr('rx', '5')
          .attr('ry', '5')
          .attr('id', (d) => {
            return 'leave_circle_' + d.index
          })
        // leave text
        leave.append('text')
          .attr('x', function(d) {
            return 4
          })
          .attr('dy',  '1.5em')
          .transition()
          .duration(transitionInterval)
          .delay((d, i) => {
            return d.index / transitionNum * transitionInterval
          })
          .attr('fill', leaveTextColor)
          .attr('text-anchor', 'start')
          .attr('font-size', leaveFontSize)
          .attr('id', (d) => {
            return 'leave_text_' + d.index
          })
          .text(function(d) {
            return d.leaveName
          })
    }

    // 绘制父节点
    drawBubbles () {
        const bubbles = this.bubbles
        const keys = Object.keys(bubbles)
        const data = this.data
        const svg = this.svg
        const bubble = svg.selectAll('.bubble')
          .data(keys)
          .enter().append('g')
          .attr('class', 'bubble')
        bubble.append('rect')
          .attr('x', (d) => { return bubbles[d].cx - this.splitByLength(d, leaveFontSize) / 2})
          .attr('y', (d) => { return bubbles[d].cy })
          .attr('rx', '5')
          .attr('ry', '5')
          .transition()
          .attr('height', rectHeight)
          .duration(transitionInterval)
          .delay((d, i) => {
            return 10
          })
          .attr('width', (d) => {
            const $this = d3.select('.bubble')
            let text = $this.append('text')
              .attr('font-size', leaveFontSize)
              .attr('class', 'text2')
              .text(d)
            let width = text.node().getComputedTextLength()
            let text1 = d3.select('.text2')
            text1.remove()
            return width + 10
          })
          .attr('fill', rectColor)
        bubble.append('text')
          .attr('x', (d) => { return bubbles[d].cx - this.splitByLength(d, leaveFontSize) / 2})
          .attr('y', (d) => { return bubbles[d].cy })
          .attr('dy',  -4 + (rectHeight + leaveFontSize) / 2)
          .attr('dx',  5)
          .transition()
          .duration(this.transitionInterval)
          .attr('fill', (d) => {
            return leaveTextColor
          })
          .attr('text-anchor', 'start')
          .attr('font-size', leaveFontSize)
          .text((d) => {
            return d
          })
    }

    // 字符串长度
    splitByLength(str, fontsize){
        let curLen = 0;
        for(let i=0;i<str.length;i++){
            let code = str.charCodeAt(i);
            let pixelLen = code > 255 ? fontsize : fontsize/2;
            curLen += pixelLen;
        }
        return curLen;
    }
}