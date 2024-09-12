class ElevatorJob {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.totalFloors = configData.totalFloors;
    this.floorHeight = configData.floorHeight;
    this.startTime = new Date();
    this.finishTime = null;
    this.deliveredCount = 0;
    this.mans = mans;

    // create elevator (based on configuration in constants filr)
    this.elevators = Array.from({ length: configData.elevatorsCount }, (_, idx) => 
      new Elevator(idx, configData.totalFloors, configData.floorHeight, canvas.height, configData.elevatorWidth, configData.elevatorHeight, configData.elevatorsCount)
    );

    // increment counter when done deliver
    this.elevators.forEach(elevator => {
      elevator.onRequestComplete = () => {
        this.deliveredCount += 1; 
        this.updateDeliverCount(); 
      };
    });
  }

  drawElevators() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); 
    
    this.ctx.fillStyle = 'black'; 
    for (let i = 0; i < this.totalFloors; i++) {
      const yPosition = this.canvas.height - (i+1)*this.floorHeight; 
      this.ctx.fillText(`Floor ${i+1}`, 10, yPosition+this.floorHeight - 2); 

      this.ctx.beginPath();
      this.ctx.moveTo(0, yPosition);
      this.ctx.lineTo(this.canvas.width, yPosition);
      this.ctx.stroke();

      this.ctx.beginPath();
      this.ctx.moveTo(this.elevators.length*15+55, yPosition);
      this.ctx.lineTo(this.elevators.length*15+55, yPosition+this.canvas.height);
      this.ctx.stroke();
    }
    this.elevators.forEach(elevator => elevator.draw(this.ctx));
  }

  updateDeliverCount() {
    document.getElementById("startTime").innerHTML = this.startTime.toLocaleString();
    if (this.finishTime) {
      document.getElementById("finishTime").innerHTML = this.finishTime.toLocaleString();
      document.getElementById("gapTime").innerHTML = getDateTimeSince(this.startTime);
    }
    document.getElementById("counter").innerHTML = this.deliveredCount;
  }

  run() {
    this.finishTime = null;
    this.deliveredCount = 0;
    this.updateDeliverCount();

    // assign value array to queue with round robin
    this.mans.forEach((man, index) => {
      const elevatorIndex = index % this.elevators.length;
      this.elevators[elevatorIndex].requestQueue.push(man);
    });

    // process request for each elevator
    this.elevators.forEach(elevator => elevator.processRequests(() => {
      this.drawElevators();
      if (this.elevators.every(elevator => elevator.requestQueue.length === 0 && elevator.state === 0)) {
        this.finishTime = new Date();
        this.updateDeliverCount();
      }
    }));
  }
}

class Elevator {
  constructor(index, totalFloors, floorHeight, canvasHeight, width, height, elevatorsCount) {
    this.index = index;
    this.currentFloor = 0;
    this.targetFloor = 0;
    this.animationId = null;
    this.state = 0;

    this.width = width;
    this.height = height;
    this.totalFloors = totalFloors;
    this.floorHeight = floorHeight;
    this.canvasHeight = canvasHeight;
    this.elevatorsCount = elevatorsCount;

    this.requestQueue = [];
    this.waitingFloors = new Set();
  }

  draw(ctx) {
    const gapBetween = this.index*15;
    const xPos = 55+gapBetween;
    const yPos = this.canvasHeight - (this.currentFloor+1)*this.floorHeight+(this.floorHeight - this.height);

    ctx.fillStyle = 'red';
    ctx.fillRect(xPos, yPos, this.width, this.height);

    // Display "Waiting" on floors with waiting people
    this.waitingFloors.forEach(floor => {
      ctx.fillStyle = 'red';
      ctx.fillText('Waiting', this.elevatorsCount*15+65, this.canvasHeight - floor*this.floorHeight+10);
    });

    ctx.stroke();
  }

  animate(cb, drawElevators) {
    this.state = 1; 
    const gap = this.targetFloor - this.currentFloor; 
    const speed = Math.abs(gap) < 5 ? 0.1 : 0.2; 

    if (gap > 0) {
      this.currentFloor += speed;
      if (this.currentFloor > this.targetFloor) this.currentFloor = this.targetFloor; 
    } else if (gap < 0) {
      this.currentFloor -= speed;
      if (this.currentFloor < this.targetFloor) this.currentFloor = this.targetFloor; 
    }
    
    if (Math.abs(this.currentFloor - this.targetFloor) < 0.1) {
      this.currentFloor = this.targetFloor; 
      this.state = 0; 
      cancelAnimationFrame(this.animationId); 

      if (typeof cb === 'function') cb(this);
    } else {
      drawElevators(); 
      this.animationId = requestAnimationFrame(() => this.animate(cb, drawElevators));
    }
  }

  // process the queue
  processRequests(drawElevators) {
    if (this.requestQueue.length > 0) {
      const man = this.requestQueue.shift();  // get first queue
      this.waitingFloors.add(man.from);
      this.targetFloor = man.from - 1;
      
      this.animate(() => {
        setTimeout(() => {
          this.waitingFloors.delete(man.from);
          this.targetFloor = man.to - 1;

          this.animate(() => {
            if (man.to - 1 === this.currentFloor) {
              drawElevators();
              setTimeout(() => {
                if (typeof this.onRequestComplete === 'function') {
                  this.onRequestComplete();
                  console.log(`Delivered by elevator-${this.index+1}, from ${man.from} to ${man.to}.`);
                }
                this.processRequests(drawElevators); // next queue
              }, 1000);
            }
          }, drawElevators);
        }, 1000);
      }, drawElevators);
    } else {
      this.targetFloor = 0;
      this.animate(() => {
        drawElevators();
      }, drawElevators);
    }
  }
}

const canvas = document.getElementById('elevatorCanvas');
const elevator = new ElevatorJob(canvas);
elevator.run();