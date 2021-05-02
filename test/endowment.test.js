const assert = require("chai").assert;
const truffleAssert = require('truffle-assertions');
const Endowment = artifacts.require("Endowment");

contract("Endowment", (accounts) => {
    let endowment;

    before(async () => {
        endowment = await Endowment.deployed();
    });

    describe("donating to the endowment", async () => {
        const donationEth = 5;
        const donationWei = web3.utils.toBN(
          web3.utils.toWei(donationEth.toString(), 'ether')
        );

        let donor, accountFunds, txInfo;
  
        before(async () => {
            donor = accounts[0];
            accountFunds = web3.utils.toBN(
              await web3.eth.getBalance(donor)
            );
            txInfo = await endowment.donate(
                donationWei, 
                { from: donor, value: donationWei }
            );
        });

        it("adds to the endowment total", async () => {
            const funds = await endowment.funds();

            assert.equal(donationWei.toString(), funds, 
                "The total funds are equal to the first `donationWei`");
        });

        it("stores the donation", async () => {
            const donation = (await endowment.donations())[0];
            assert.equal(donationWei, donation.amount, 
                "The amount in the first donation should be the `donationWei`");
            assert.equal(donor, donation.donor, 
                "The donor should be recorded in the donation");
        });

        it("subtracts funds from the donor", async () => {
            const remainingDonorBalance = await web3.eth.getBalance(donor);
            const tx = await web3.eth.getTransaction(txInfo.tx);
            const gasCost = web3.utils.toBN(tx.gasPrice * txInfo.receipt.gasUsed);
            
            const total = accountFunds.sub(donationWei).sub(gasCost);
            assert.equal(total.toString(), remainingDonorBalance, 
                "The account should be debited by `donationWei` plus gas costs");
        });

        it("emits an event notifying the donation was made", async () => {
            truffleAssert.eventEmitted(txInfo, 'DonationEvent', (ev) => {
                return ev._donor === donor && ev._amount.toString() === donationWei.toString();
            });
        });

        describe("with multiple donations from the same donor", async => {
            const secondDonationEth = 3
            const secondDonationWei = web3.utils.toBN(
              web3.utils.toWei(secondDonationEth.toString(), 'ether')
            );

            let secondTxInfo;

            before(async () => {
                secondTxInfo = await endowment.donate(
                    secondDonationWei, 
                    { from: donor, value: secondDonationWei }
                );
            });

            it("combines both donations in the total funds", async () => {
                const funds = await endowment.funds();

                const totalWei = web3.utils.toWei((donationEth + secondDonationEth).toString(), 'ether');
                assert.equal(totalWei, funds, 
                    "The total funds are equal to both donations from the donor");
            });

            it("subtracts more funds from the donor", async () => {
                const remainingDonorBalance = await web3.eth.getBalance(donor);

                const tx = await web3.eth.getTransaction(txInfo.tx);
                const gasCost = web3.utils.toBN(
                    tx.gasPrice * txInfo.receipt.gasUsed
                );

                const secondTx = await web3.eth.getTransaction(secondTxInfo.tx);
                const secondGasCost = web3.utils.toBN(
                  secondTx.gasPrice * secondTxInfo.receipt.gasUsed
                );

                const remainingFunds = accountFunds
                    .sub(donationWei)
                    .sub(gasCost)
                    .sub(secondDonationWei)
                    .sub(secondGasCost);

                assert.equal(remainingFunds.toString(), remainingDonorBalance, 
                    "The account should be debited by both donation amounts plus gas costs");              
            });

            it("provides the full amount the donor has donated", async () => {
                const donatedAmount = await endowment.donorTotal(donor);
                const total = donationWei.add(secondDonationWei);
                assert.equal(total.toString(), donatedAmount.toString(), 
                    "The donatedAmount for the donor should equal the combination of the two donations");
            });

            describe("with donations from different donors", async => {
                const otherDonationEth = 12;
                const otherDonationWei = web3.utils.toBN(
                    web3.utils.toWei(otherDonationEth.toString(), 'ether')
                );
        
                let otherDonor, otherTxInfo, otherAccountFunds;
    
                before(async () => {
                    otherDonor = accounts[1];
                    otherAccountFunds = web3.utils.toBN(
                      await web3.eth.getBalance(otherDonor)
                    );
                    otherTxInfo = await endowment.donate(
                        otherDonationWei, 
                        { from: otherDonor, value: otherDonationWei }
                    );
                });
    
                it("should provide the total amount donated between the two donors", async () => {
                    const funds = await endowment.funds();
    
                    const totalEth = donationEth + secondDonationEth + otherDonationEth;
                    const totalWei = web3.utils.toWei(totalEth.toString(), 'ether');
                    assert.equal(totalWei, funds.toString(), 
                        "The total funds are equal to all donations");
                });

                it("should debit the second donor's account", async () => {
                    const remainingDonorBalance = await web3.eth.getBalance(otherDonor);

                    const tx = await web3.eth.getTransaction(otherTxInfo.tx);
                    const gasCost = web3.utils.toBN(
                        tx.gasPrice * otherTxInfo.receipt.gasUsed
                    );
        
                    const remainingFunds = otherAccountFunds
                        .sub(otherDonationWei)
                        .sub(gasCost);
    
                    assert.equal(remainingFunds.toString(), remainingDonorBalance, 
                        "The other donor should have the proper funds debited from their account"); 
                });
            });
        });
    });
});