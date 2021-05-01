const assert = require("chai").assert;
const truffleAssert = require('truffle-assertions');
const Endowment = artifacts.require("Endowment");

contract("Endowment", (accounts) => {
    let endowment;

    before(async () => {
        endowment = await Endowment.deployed();
    });

    describe("donating to the endowment", async () => {
        const donationAmount = 5;

        let donor, accountFunds, tx;

        before("first donation", async () => {
            donor = accounts[0];
            accountFunds = await web3.eth.getBalance(donor);
            tx = await endowment.donate(donationAmount, { from: donor });
        });

        it("adds to the endowment total", async () => {
            const funds = await endowment.funds;
            assert.equal(donationAmount, funds, "The total should now be equal to the first donation amount");
        });

        it("subtracts funds from the donor", async () => {
            const remainingDonorFunds = await web3.eth.getBalance(donor);
            assert.equal(remainingDonorFunds, accountFunds - donationAmount, "The account should be debited by `donationAmount`");
        });

        it("emits an event notifying the donation was made", async () => {
          truffleAssert.eventEmitted(tx, 'Donation', (ev) => {
              return ev.amount === donationAmount;
          });
        });

    });

});