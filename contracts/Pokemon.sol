//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Pokemon is ERC721, ERC721Enumerable, ERC721URIStorage, Ownable {

    using SafeMath for uint256;

    //URI
    string private baseURI;

    struct PokemonStats {
        string name;
        uint8 level;
        uint16 maxLifePoint;
        mapping(uint8 => uint16) attacks;
        bool isFighting;
        uint256 versusId;
        uint16 lifePoint;
        bool cooldown;
        uint256 lastAttack;
    }

    mapping(uint256 => PokemonStats) public pokemonStats;

    event BattleBegin(
        uint256 versusId
    );

    event BattleWin(
        uint256 versusId,
        uint8 newLevel
    );

    event AttackSuccess(
        uint256 versusId,
        uint8 dmg,
        uint16 versusRemainingLP
    );

    constructor() {
    }

    function mint(string memory _name) public {
        _mint(msg.sender, _name);
    }

    function _mint(address _to, string memory _name) internal {
        require(balanceOf(_to) + 1 <= 6,"Cant have more than 6 Pokemon");
        uint256 tokenId = totalSupply() + 1;
        _safeMint(_to, tokenId);

        PokemonStats storage pokemon = pokemonStats[tokenId];
        pokemon.name = _name;
        pokemon.level = 1;
        pokemon.maxLifePoint = uint16(_randomNumber(10, 20, Strings.toString(tokenId)));
        pokemon.attacks[0] = 5;
        pokemon.isFighting = false;
        pokemon.lifePoint = pokemon.maxLifePoint;
    }

    function _randomNumber(uint256 _minValue, uint256 _maxValue, string memory _salt) internal pure  returns(uint randomNumber) {
        require(_maxValue > _minValue, "minimal value can't be greater than maximal value");
        return ((uint(keccak256(msg.sender)) + uint(keccak256(_salt)) + uint(keccak256(block.timestamp))) % (_maxValue - _minValue) + _minValue);
    }

    function startBattle(uint256 _id, uint256 _versusId) public {
        require(ownerOf(_id) == msg.sender, "Must be the owner");
        require(ownerOf(_versusId) != msg.sender, "Can't be the owner of the ennemy");
        require(_versusId != _id, "Can't fight himself");
        require(!pokemonStats[_id].isFighting, "Already fighting");

        pokemonStats[_id].isFighting = true;
        pokemonStats[_id].versusId = _versusId;
        pokemonStats[_id].cooldown = true;
        pokemonStats[_id].lastAttack = block.timestamp;
        
        pokemonStats[pokemonStats[_id].versusId].isFighting = true;
        pokemonStats[pokemonStats[_id].versusId].versusId = _id;
        pokemonStats[pokemonStats[_id].versusId].cooldown = false;

        emit BattleBegin(
            _versusId
        );

    }

    /**
    */
    function attack(uint256 _id, uint8 _choice) public {
        require(ownerOf(_id) == msg.sender, "Must be the owner");
        require(pokemonStats[_id].isFighting, "Not in a fight");
        if(pokemonStats[_id].cooldown){
            require((block.timestamp.trysub(pokemonStats[_id].lastAttack)) > 3600 , "It's your oponent's turn");
        }

        if(pokemonStats[pokemonStats[_id].versusId].lifePoint <= pokemonStats[_id].attacks[_choice]) { // victoire
            
            pokemonStats[_id].level ++;
            pokemonStats[_id].maxLifePoint += 5;
            
            pokemonStats[_id].lifePoint = pokemonStats[_id].maxLifePoint;
            pokemonStats[_id].isFighting = false;
            pokemonStats[pokemonStats[_id].versusId].lifePoint = pokemonStats[pokemonStats[_id].versusId].maxLifePoint;
            pokemonStats[pokemonStats[_id].versusId].isFighting = false;

            emit BattleWin(
                pokemonStats[_id].versusId,
                pokemonStats[_id].level
            );
        }
        else { // combat continue
            pokemonStats[pokemonStats[_id].versusId].lifePoint = pokemonStats[pokemonStats[_id].versusId].lifePoint.trySub(pokemonStats[_id].attacks[_choice]);

            pokemonStats[_id].cooldown = true;
            pokemonStats[_id].lastAttack = block.timestamp;

            pokemonStats[pokemonStats[_id].versusId].cooldown = false;

            emit AttackSuccess(
                pokemonStats[_id].versusId,
                pokemonStats[_id].attacks[_choice],
                pokemonStats[pokemonStats[_id].versusId].lifePoint
            );
        }        
    }

    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }

    function setBaseURI(string memory _newBaseURI) external onlyOwner {
        baseURI =  _newBaseURI;
    }
}
