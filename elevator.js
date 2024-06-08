class Elevator {
  constructor() {
    this.currentFloor = 0;
    this.requests = [];
    this.moving = false;
  }

  // Method to request the elevator to a specific floor
  requestFloor(floor) {
    this.requests.push(floor);
    if (!this.moving) {
      this.processRequests();
    }
  }

  // Process the queue of requests
  async processRequests() {
    this.moving = true;
    while (this.requests.length > 0) {
      const nextFloor = this.requests.shift();
      await this.moveToFloor(nextFloor);
    }
    this.moving = false;
  }

  // Simulate moving to a specific floor
  async moveToFloor(floor) {
    const travelTime = Math.abs(this.currentFloor - floor) * 1000; // 1 second per floor
    console.log(`Moving from floor ${this.currentFloor} to floor ${floor}`);
    await new Promise(resolve => setTimeout(resolve, travelTime));
    this.currentFloor = floor;
    console.log(`Arrived at floor ${floor}`);
  }
}

// Test the elevator system
async function testElevator() {
  const elevator = new Elevator();

  // Simulate requests
  elevator.requestFloor(3);
  elevator.requestFloor(5);
  elevator.requestFloor(2);

  // Wait for all requests to be processed
  await new Promise(resolve => setTimeout(resolve, 10000)); // Wait for 10 seconds
  console.log('All requests processed');
}

testElevator();
