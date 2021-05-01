const assert = require("chai").assert;
const truffleAssert = require('truffle-assertions');
const Endowment = artifacts.require("Endowment");

contract("Endowment", (accounts) => {
    let endowment;

    before(async () => {
        endowment = await Endowment.deployed();
    });

    describe("donating to the endowment", async () => {
        const donationAmount = web3.utils.toWei('5', 'ether');

        let donor, accountFunds, txInfo;

        before("first donation", async () => {
            donor = accounts[0];
            accountFunds = await web3.eth.getBalance(donor);
            txInfo = await endowment.donate(donationAmount, { from: donor, value: donationAmount });
        });

        it("adds to the endowment total", async () => {
            const funds = await endowment.funds();
            assert(funds > 0, "There are now funds in the endowment.")
            assert.equal(donationAmount, funds, "The total funds are equal to the first `donatedAmount`");
        });

        it("stores the donation", async () => {
            const donation = (await endowment.donations())[0];
            assert.equal(donationAmount, donation.amount, "The amount in the first donation should be the `donatedAmount`");
            assert.equal(donor, donation.donor, "The donor should be recorded in the donation");
        });

        it("subtracts funds from the donor", async () => {
            const remainingDonorBalance = await web3.eth.getBalance(donor);
            const tx = await web3.eth.getTransaction(txInfo.tx);
            const gasCost = tx.gasPrice * txInfo.receipt.gasUsed;
            assert.equal(accountFunds - donationAmount - gasCost, remainingDonorBalance, "The account should be debited by `donationAmount`");
        });

        it("emits an event notifying the donation was made", async () => {
          truffleAssert.eventEmitted(txInfo, 'DonationEvent', (ev) => {
              return ev._donor === donor && ev._amount.toString() === donationAmount;
          });
        });

    });

});