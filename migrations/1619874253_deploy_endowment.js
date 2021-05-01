var Endowment = artifacts.require("Endowment");

module.exports = function(_deployer) {
  _deployer.deploy(Endowment);
};