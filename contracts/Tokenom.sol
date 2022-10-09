//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Tokenom is ERC721Enumerable, Ownable {
    using SafeMath for uint256;
    using SafeMath for uint16;

    //URI
    string private baseURI;

    uint256 public attackCooldown;

    struct Attack {
        string name;
        uint256 damage;
        uint256 precision; // in percentage
    }

    uint32 private maxSpecies;

    struct TokenomStats {
        string name;
        uint8 level;
        uint16 maxLifePoint;
        uint32 species;
        mapping(uint8 => Attack) attacks;
        bool isFighting;
        uint256 versusId;
        uint16 lifePoint;
        bool cooldown;
        uint256 lastAttack;
    }

    mapping(uint256 => TokenomStats) public tokenomStats;

    event BattleBegin(uint256 versusId);

    event BattleWin(uint256 versusId, uint8 newLevel);

    event AttackSuccess(uint256 versusId, uint8 dmg, uint16 versusRemainingLP);

    event AttackFailed(uint256 versusId, uint16 versusRemainingLP);

    constructor(
        string memory name,
        string memory symbol,
        uint256 _attackCooldown,
        uint32 _maxSpecies
    ) ERC721(name, symbol) {
        _transferOwnership(msg.sender);
        attackCooldown = _attackCooldown;
        maxSpecies = _maxSpecies;
    }

    function mint(string memory _name) public {
        _mint(msg.sender, _name);
    }

    function _mint(address _to, string memory _name) internal {
        require(balanceOf(_to) + 1 <= 6, "Cant have more than 6 Tokenom");
        uint256 tokenId = totalSupply() + 1;
        _safeMint(_to, tokenId);

        TokenomStats storage tokenom = tokenomStats[tokenId];
        tokenom.name = _name;
        tokenom.level = 1;
        tokenom.maxLifePoint = uint16(
            _randomNumber(10, 20, Strings.toString(tokenId))
        );
        Attack storage firstAttack = tokenomStats[tokenId].attacks[0];
        firstAttack.name = "charge";
        firstAttack.damage = 5;
        firstAttack.precision = 75;
        tokenom.isFighting = false;
        tokenom.lifePoint = tokenom.maxLifePoint;
        tokenom.species = uint32(_randomNumber(1, maxSpecies, Strings.toString(tokenId)));
    }

    function _randomNumber(
        uint256 _minValue,
        uint256 _maxValue,
        string memory _salt
    ) internal view returns (uint256 randomNumber) {
        require(
            _maxValue > _minValue,
            "minimal value can't be greater than maximal value"
        );
        return (((
            uint256(
                keccak256(abi.encodePacked(block.timestamp, _salt, msg.sender))
            )
        ) % (_maxValue - _minValue)) + _minValue);
    }

    function startBattle(uint256 _id, uint256 _versusId) public {
        require(
            _exists(_versusId),
            "Wrong versusId : Your target does not exist"
        );
        require(ownerOf(_id) == msg.sender, "Must be the owner");
        require(
            ownerOf(_versusId) != msg.sender,
            "Can't be the owner of the ennemy"
        );
        require(
            !tokenomStats[_id].isFighting,
            "Your tokenom is already fighting"
        );
        require(
            !tokenomStats[_versusId].isFighting,
            "Your target is already fighting"
        );

        tokenomStats[_id].isFighting = true;
        tokenomStats[_id].versusId = _versusId;
        tokenomStats[_id].cooldown = true;
        tokenomStats[_id].lastAttack = block.timestamp;

        tokenomStats[tokenomStats[_id].versusId].isFighting = true;
        tokenomStats[tokenomStats[_id].versusId].versusId = _id;
        tokenomStats[tokenomStats[_id].versusId].cooldown = false;

        emit BattleBegin(_versusId);
    }

    /**
     */
    function attack(uint256 _id, uint8 _choice) public {
        require(ownerOf(_id) == msg.sender, "Must be the owner");
        require(tokenomStats[_id].isFighting, "Not in a fight");
        if (tokenomStats[_id].cooldown) {
            require(
                (uint256(block.timestamp) - tokenomStats[_id].lastAttack) >
                    attackCooldown,
                "It's your oponent's turn"
            );
        }

        require(
            tokenomStats[_id].attacks[_choice].damage > 0,
            "This attack does not exist or have not be learned yet by your tokenom"
        );

        if (
            _randomNumber(0, 100, tokenomStats[_id].attacks[_choice].name) <
            tokenomStats[_id].attacks[_choice].precision
        ) {
            //attack Success
            if (
                tokenomStats[tokenomStats[_id].versusId].lifePoint <=
                tokenomStats[_id].attacks[_choice].damage
            ) {
                // victoire
                tokenomStats[_id].level++;
                tokenomStats[_id].maxLifePoint += 5;

                tokenomStats[_id].lifePoint = tokenomStats[_id].maxLifePoint;
                tokenomStats[_id].isFighting = false;
                tokenomStats[tokenomStats[_id].versusId]
                    .lifePoint = tokenomStats[tokenomStats[_id].versusId]
                    .maxLifePoint;
                tokenomStats[tokenomStats[_id].versusId].isFighting = false;

                emit BattleWin(
                    tokenomStats[_id].versusId,
                    tokenomStats[_id].level
                );
            } else {
                // combat continue
                tokenomStats[tokenomStats[_id].versusId].lifePoint = uint16(
                    tokenomStats[tokenomStats[_id].versusId].lifePoint.sub(
                        tokenomStats[_id].attacks[_choice].damage
                    )
                );

                tokenomStats[_id].cooldown = true;
                tokenomStats[_id].lastAttack = block.timestamp;

                tokenomStats[tokenomStats[_id].versusId].cooldown = false;

                emit AttackSuccess(
                    tokenomStats[_id].versusId,
                    uint8(tokenomStats[_id].attacks[_choice].damage),
                    tokenomStats[tokenomStats[_id].versusId].lifePoint
                );
            }
        } else {
            // attack failed
            emit AttackFailed(
                tokenomStats[_id].versusId,
                tokenomStats[tokenomStats[_id].versusId].lifePoint
            );
        }
    }

    function getTokenomAttack(uint tokenId, uint8 attackId) 
        public 
        view 
        returns (string memory name,
        uint256 damage,
        uint256 precision)
    {
        require(tokenomStats[tokenId].attacks[attackId].damage > 0, "this tokenom doesn't know this attack");

        Attack memory atk = tokenomStats[tokenId].attacks[attackId];

        return (atk.name, atk.damage, atk.precision);
    }

    function getTokenIds(address _owner)
        public
        view
        returns (uint256[] memory)
    {
        uint256[] memory _tokensOfOwner = new uint256[](
            ERC721.balanceOf(_owner)
        );
        uint256 i;

        for (i = 0; i < ERC721.balanceOf(_owner); i++) {
            _tokensOfOwner[i] = ERC721Enumerable.tokenOfOwnerByIndex(_owner, i);
        }
        return (_tokensOfOwner);
    }

    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }

    function setBaseURI(string memory _newBaseURI) external onlyOwner {
        baseURI = _newBaseURI;
    }

    function setMaxSpecies(uint32 _newMaxSpecies) external onlyOwner {
        require(maxSpecies < _newMaxSpecies, "Can't decrease the amount of tokenom species");
        maxSpecies =  _newMaxSpecies;
    }

    function getMaxSpecies() public view returns (uint32) {
        return maxSpecies;
    }

    function tokenURI(uint256 tokenId) public override view returns (string memory) {
        return string(abi.encodePacked(baseURI, Strings.toString(tokenomStats[tokenId].species), ".png"));
    }
}
