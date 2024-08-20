const schedule = require("node-schedule");
const { writeFileSync } = require("fs");

const data = {
  devices: [
    {
      deviceId: "light-001",
      deviceType: "smart_light",
      action: "set_state",
      payload: {
        state: "on",
        brightness: 75,
        color: "#FFA500",
      },
      timestamp: "2024-08-18T10:30:00Z",
    },
    {
      deviceId: "thermostat-002",
      deviceType: "smart_thermostat",
      action: "set_temperature",
      payload: {
        temperature: 22.5,
        mode: "cooling",
        fan: "auto",
      },
      timestamp: "2024-08-18T10:35:00Z",
    },
    {
      deviceId: "plug-003",
      deviceType: "smart_plug",
      action: "set_state",
      payload: {
        state: "off",
        schedule: {
          enable: true,
          start_time: "2024-08-18T18:00:00Z",
          end_time: "2024-08-18T23:00:00Z",
        },
      },
      timestamp: "2024-08-18T10:40:00Z",
    },
    {
      deviceId: "lock-004",
      deviceType: "smart_lock",
      action: "set_state",
      payload: {
        state: "lock",
        auto_lock: {
          enable: true,
          delay: 300,
        },
      },
      timestamp: "2024-08-18T10:45:00Z",
    },
    {
      deviceId: "camera-005",
      deviceType: "smart_camera",
      action: "set_state",
      payload: {
        state: "on",
        recording_mode: "motion_detection",
        resolution: "1080p",
      },
      timestamp: "2024-08-18T10:50:00Z",
    },
    {
      deviceId: "blinds-006",
      deviceType: "smart_blinds",
      action: "set_position",
      payload: {
        position: 50,
        schedule: {
          enable: true,
          open_time: "2024-08-18T07:00:00Z",
          close_time: "2024-08-18T19:00:00Z",
        },
      },
      timestamp: "2024-08-18T10:55:00Z",
    },
  ],
};

class IoT {
  static async initAutoUpdateState() {
    writeFileSync(
      "./data/json/state.default.json",
      JSON.stringify(data, null, 2)
    );
  }
  static async getSystemData() {
    return JSON.stringify(data);
  }
}

schedule.scheduleJob("0 */2 * * *", async () => {
  await IoT.initAutoUpdateState();
});

module.exports = IoT;
