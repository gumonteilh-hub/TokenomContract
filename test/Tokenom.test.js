const { expect } = require("chai");
const { ethers } = require("hardhat");
const { constants, utils } = require("ethers");


describe("Tokenom", function () {

  let tokenom;
  let owner;
  let user1;

  before(async function () {
    [owner, user1] = await ethers.getSigners();
    let Tokenom = await ethers.getContractFactory("Tokenom");
    tokenom = await Tokenom.deploy("TokeNom", "TKM", 1, 5);
  });

  describe('owner', async function () {
    it("Should be the owner of the contract", async function () {
      expect(await tokenom.owner()).to.equal(owner.address);
    });
  });

  describe('mint', async function () {
    it('Should send a transfert event to the user', async function () {
      await expect(tokenom.mint("Guigui"))//id 1
        .to.emit(tokenom, "Transfer")
        .withArgs(constants.AddressZero, owner.address, 1);
    });

    it('revert when user mint more than 6', async function () {
      await tokenom.mint("Guigui2")//id 2
      await tokenom.mint("Guigui3")//id 3
      await tokenom.mint("Guigui4")//id 4
      await tokenom.mint("Guigui5")//id 5
      await tokenom.mint("Guigui6")//id 6
      await expect(tokenom.mint("Guigui7"))
        .to.be.revertedWith("Cant have more than 6 Tokenom");
    });
  });

  describe('startBattle', async function () {
    it('revert when the sender is not the owner of the tokenom', async function () {
      await expect(tokenom.connect(user1).startBattle(1, 2))
        .to.be.revertedWith("Must be the owner");
    });

    it('revert when the sender is the owwner of the ennemy', async function () {
      await expect(tokenom.startBattle(1, 2))
        .to.be.revertedWith("Can't be the owner of the ennemy");
    });

    it('revert when the tokenom of the sender is already fighting', async function () {
      await tokenom.connect(user1).mint("user1");//id 7
      await tokenom.connect(user1).mint("user2");//id 8
      await tokenom.startBattle(1, 7);
      await expect(tokenom.startBattle(1, 8))
        .to.be.revertedWith("Your tokenom is already fighting");
    });

    it('revert when the tokenom target is already fighting', async function () {
      await expect(tokenom.startBattle(2, 7))
        .to.be.revertedWith("Your target is already fighting");
    });

    it('revert when the target does not exist', async function () {
      await expect(tokenom.startBattle(1, 100))
        .to.be.revertedWith("Wrong versusId : Your target does not exist");
    });

    it('Should emit a StartBattle Event to the user', async function () {
      await expect(tokenom.startBattle(3, 8))
        .to.emit(tokenom, "BattleBegin")
        .withArgs(8);
    });
  });

  describe('attack', async function () {
    it('revert when the sender is not the owner of the tokenom', async function () {
      await expect(tokenom.connect(user1).attack(1, 0))
        .to.be.revertedWith("Must be the owner");
    });

    it('revert when the tokenom is not in a fight', async function () {
      await expect(tokenom.attack(2, 0))
        .to.be.revertedWith("Not in a fight");
    });

    it('revert if the attacks does not exist', async function () {
      await expect(tokenom.connect(user1).attack(8, 26))
        .to.be.revertedWith("This attack does not exist or have not be learned yet by your tokenom");
    });

    it('Should emit an  Event to the user', async function () {
      var tokenomstats = await tokenom.tokenomStats(3);
      await expect(tokenom.connect(user1).attack(8, 0))
        .to.emit(tokenom, "AttackSuccess")
        .withArgs(3, 5, tokenomstats.lifePoint - 5);
    });

    it('revert when the tokenom is in cooldown', async function () {
      await expect(tokenom.connect(user1).attack(8, 0))
        .to.be.revertedWith("It's your oponent's turn");
    });

    it('Should emit an  Event to the user after waiting for cooldown', async function () {
      var tokenomstats = await tokenom.tokenomStats(3);
      await new Promise(r => setTimeout(r, 1000));
      if (tokenomstats.lifePoint > 5) {
        await expect(tokenom.connect(user1).attack(8, 0))
          .to.emit(tokenom, "AttackSuccess")
          .withArgs(3, 5, tokenomstats.lifePoint - 5);
      }
      else {
        await expect(tokenom.connect(user1).attack(8, 0))
          .to.emit(tokenom, "BattleWin")
          .withArgs(3, 2);
      }
    });

    it('Should emit an  Event when the fight is over', async function () {
      await tokenom.connect(user1).mint("user3");//id 9
      await tokenom.startBattle(4,9);
      var tokenomstats = [await tokenom.tokenomStats(4), await tokenom.tokenomStats(9)];
      var turn = 1;
      var nextTurn = [owner, user1];
      var allyId = [4, 9]
      var ennemyId = [9, 4];

      
      while(true){
        //console.log("tokenom id :" + ennemyId[turn] + "\n lifepoint : "+ tokenomstats[(turn+1)%2].lifePoint );
        if(tokenomstats[(turn+1)%2].lifePoint <= 5){
          await expect(tokenom.connect(nextTurn[turn]).attack(allyId[turn],0))
            .to.emit(tokenom, "BattleWin")
            .withArgs(ennemyId[turn], tokenomstats[turn].level + 1);
            break;
        }
        await tokenom.connect(nextTurn[turn]).attack(allyId[turn], 0);
        tokenomstats[turn] = await tokenom.tokenomStats(allyId[turn]);
        tokenomstats[!turn] = await tokenom.tokenomStats(ennemyId[turn]);
        turn == 0 ? turn=1 : turn=0;
      }
    });
  });

  describe('maxSpecies', async function () {
    it('should return the amount of maxSpecies set during deployment', async function () {
      expect(await tokenom.getMaxSpecies()).to.equal(5);
    });

    it('should revert if newMaxSpecies < maxSpecies', async function () {
      await expect(tokenom.setMaxSpecies(3))
        .to.be.revertedWith("Can't decrease the amount of tokenom species");
    });

    it('should update the amount of maxSpecies', async function () {
      await tokenom.setMaxSpecies(9);
      expect(await tokenom.getMaxSpecies()).to.equal(9);
    });
  });
});
