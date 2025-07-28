const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

/**
 * Execute network commands to allow or block MAC addresses
 * @param {string} action - 'allow' or 'block'
 * @param {string} macAddress - MAC address to allow/block
 */
async function executeNetworkCommand(action, macAddress) {
  try {
    // This is a simplified example - actual implementation would depend on your network setup
    if (action === 'allow') {
      // Add to allowed devices in iptables
      await execPromise(`sudo iptables -t nat -I PREROUTING -m mac --mac-source ${macAddress} -j ACCEPT`);
      console.log(`Network access allowed for MAC: ${macAddress}`);
    } else if (action === 'block') {
      // Remove from allowed devices in iptables
      await execPromise(`sudo iptables -t nat -D PREROUTING -m mac --mac-source ${macAddress} -j ACCEPT`);
      console.log(`Network access blocked for MAC: ${macAddress}`);
    }
  } catch (error) {
    console.error(`Network command error for ${macAddress}:`, error);
    throw new Error(`Failed to ${action} network access for ${macAddress}`);
  }
}

module.exports = {
  executeNetworkCommand
};