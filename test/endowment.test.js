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
        const donorName = "Donor Name";
        const donationWei = web3.utils.toBN(
          web3.utils.toWei(donationEth.toString(), 'ether')
        );

        let donorAddress, accountFunds, txInfo;
  
        before(async () => {
            donorAddress = accounts[0];
            accountFunds = web3.utils.toBN(
              await web3.eth.getBalance(donorAddress)
            );
            txInfo = await endowment.donate(
                donationWei, 
                donorName,
                { from: donorAddress, value: donationWei }
            );
        });

        it("adds to the endowment total", async () => {
            const funds = await endowment.funds();

            assert.equal(donationWei.toString(), funds, 
                "The total funds are equal to the first `donationWei`");
        });

        it("associates the name provided with the wallet address", async () => {
            const name = (await endowment.donorName(donorAddress));
            assert.equal(name, donorName, 
                "The donor's name should be associated with the wallet address");
        });


        it("stores the donation", async () => {
            const donation = (await endowment.donations())[0];
            assert.equal(donationWei, donation.amount, 
                "The amount in the first donation should be the `donationWei`");
            assert.equal(donorAddress, donation.donorAddress, 
                "The donorAddress should be recorded in the donation");
        });

        it("subtracts funds from the donor", async () => {
            const remainingDonorBalance = await web3.eth.getBalance(donorAddress);
            const tx = await web3.eth.getTransaction(txInfo.tx);
            const gasCost = web3.utils.toBN(tx.gasPrice * txInfo.receipt.gasUsed);
            
            const total = accountFunds.sub(donationWei).sub(gasCost);
            assert.equal(total.toString(), remainingDonorBalance, 
                "The account should be debited by `donationWei` plus gas costs");
        });

        it("emits an event notifying the donation was made", async () => {
            truffleAssert.eventEmitted(txInfo, 'DonationEvent', (ev) => {
                console.log(ev._donorName, donorName, ev._donorName === donorName)
                return ev._donorAddress === donorAddress
                       && ev._amount.toString() === donationWei.toString()
                       && ev._donorName === donorName;
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
                    donorName,
                    { from: donorAddress, value: secondDonationWei }
                );
            });

            it("combines both donations in the total funds", async () => {
                const funds = await endowment.funds();

                const totalWei = web3.utils.toWei((donationEth + secondDonationEth).toString(), 'ether');
                assert.equal(totalWei, funds, 
                    "The total funds are equal to both donations from the donorAddress");
            });

            it("subtracts more funds from the donor", async () => {
                const remainingdonorAddressBalance = await web3.eth.getBalance(donorAddress);

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

                assert.equal(remainingFunds.toString(), remainingdonorAddressBalance, 
                    "The account should be debited by both donation amounts plus gas costs");              
            });

            it("provides the full amount the donor has donated", async () => {
                const donatedAmount = await endowment.donorTotal(donorAddress);
                const total = donationWei.add(secondDonationWei);
                assert.equal(total.toString(), donatedAmount.toString(), 
                    "The donatedAmount for the donorAddress should equal the combination of the two donations");
            });

            describe("with donations from different donor", async => {
                const otherDonorName = "Donor Name 2";
                const otherDonationEth = 12;
                const otherDonationWei = web3.utils.toBN(
                    web3.utils.toWei(otherDonationEth.toString(), 'ether')
                );
        
                let otherdonorAddress, otherTxInfo, otherAccountFunds;
    
                before(async () => {
                    otherdonorAddress = accounts[1];
                    otherAccountFunds = web3.utils.toBN(
                      await web3.eth.getBalance(otherdonorAddress)
                    );
                    otherTxInfo = await endowment.donate(
                        otherDonationWei, 
                        otherDonorName,
                        { from: otherdonorAddress, value: otherDonationWei }
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
                    const remainingdonorAddressBalance = await web3.eth.getBalance(otherdonorAddress);

                    const tx = await web3.eth.getTransaction(otherTxInfo.tx);
                    const gasCost = web3.utils.toBN(
                        tx.gasPrice * otherTxInfo.receipt.gasUsed
                    );
        
                    const remainingFunds = otherAccountFunds
                        .sub(otherDonationWei)
                        .sub(gasCost);
    
                    assert.equal(remainingFunds.toString(), remainingdonorAddressBalance, 
                        "The other donor should have the proper funds debited from their account"); 
                });

                it("should provide the single donation for the donorTotal of the other donor", async () => {
                    const donatedAmount = await endowment.donorTotal(otherdonorAddress);
                    assert.equal(otherDonationWei.toString(), donatedAmount.toString(), 
                        "The donatedAmount for the other donor should not include the first donorAddress.");  
                });

                it("associates the other donor's name with the wallet address", async () => {
                    const name = (await endowment.donorName(otherdonorAddress));
                    assert.equal(name, otherDonorName, 
                        "The other donor's name should be associated with the wallet address");
                });
            });
        });
    });
});