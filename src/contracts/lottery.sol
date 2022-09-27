// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// No importamos el 721 por herencia para evitar conflitos entre ambos contratos
// ya que muchas de sus funciones comparten nombre.

contract Lottery is ERC20, Ownable {
    // ====================================
    //          Gestión de tokens
    // ====================================

    // Direcciones de los contratos
    address public lotteryContract;
    address public NFTContract;

    // Constructor
    constructor() ERC20("Lottery", "LOT") {
        _mint(address(this), 100000);
        NFTContract = address( new NFTTickets(address(this)));
        lotteryContract = address(this);
    }

    // Resultado del sorteo
    address public winnerAddress;
    uint256 public winnerNumber;

    // Importe del premio
    uint256 public prizePool;

    // Resultado de sorteos anteriores
    struct Records {
        uint timestamp;
        address winner;
        uint number;
        uint prize;
    }

    Records [] public winners_history;

    function getLotteryRecords() public view returns(Records[] memory) {
        return winners_history;
    }

    // Precio de los tokens ERC20
    function tokenPrice(uint256 _numtokens) internal pure returns (uint256) {
        return _numtokens * (0.01 ether);
    }

    // Visualización del balance de tokens ERC220 del usuario
    function tokensBalance(address _account) public view returns (uint256) {
        return balanceOf(_account);
    }

    // Visualización del balance de tokens ERC220 del SC
    function tokensBalanceSC() public view returns (uint256) {
        return balanceOf(address(this));
    }

    // Visualización del balance de ethers del SC
    function ethersBalanceSC() public view returns (uint256) {
        return address(this).balance;
    }

    // Generación de nuevos tokens ERC20
    function _mintNewTokens(uint256 amount) public onlyOwner returns (bool) {
        _mint(address(this), amount);
        return true;
    }

    // Compra de tokens ERC20
    function buyTokens(uint256 _amount) public payable {
        // Establecimiento del coste de los token a comprar.
        uint256 tokensCost = tokenPrice(_amount);
        // Evaluación del envío de Ether por parte del usuario.
        require(msg.value >= tokensCost,"The amount sent is not enough to buy the requested tokens.");
        // Obtencion del número de tokens disponibles
        uint256 availableTokens = tokensBalanceSC();
        // Evaluación de los tokens ERC20 disponibles para su venta
        require(availableTokens >= _amount,"There are not enough available tokens to complete the purchase.");
        // Devolución de los ethers sobrantes en la compra
        uint256 returnValue = msg.value - tokensCost;
        // El Smart Contract devuelve los ethers sobrantes
        payable(msg.sender).transfer(returnValue);
        // Enviamos los Tokens ERC20 al usuario
        _transfer(address(this), msg.sender, _amount);
    }

    // Devolución de tokens ERC20 al SC.
    function returnTokens(uint256 _amount) public payable {
        // El numero de tokens debe ser mayor a 0
        require(_amount > 0, "The requested amount must be greater than zero.");
        // El usuario debe tener la cantidad de tokens a devolver.
        require(tokensBalance(msg.sender) >= _amount,"Your tokens balance must be greater than the requested amount.");
        // El usuario transfiere los tokens al SC.
        _transfer(msg.sender, address(this), _amount);
        // El SC envía los ethers al usuario.
        uint256 tokensCost = tokenPrice(_amount);
        payable(msg.sender).transfer(tokensCost);
    }

    // ====================================
    //        Gestión de la loteria
    // ====================================

    // Precio del boleto de lotería en tokens ERC20
    uint256 public ticketPrice = 1;

    // Array de participantes 
    address[] players;
    
    // Array de boletos de lotería generados
    uint256[] generatedTickets;

    // Relación persona que compra boletos con los números de los boletos comprados
    mapping(address => uint256[]) owner_tickets;

    // Relación boleto con ganador
    mapping(uint256 => address) ticket_owner;

    // Números aleatorio
    uint256 randNonce = 0;

    function getGeneratedTickets() public view returns(uint[] memory) {
        return generatedTickets;
    }

    function getPlayers() public view returns(address[] memory) {
        return players;
    }

    // Compra de boletos de lotería
    function buyTickets(uint256 _amount) public {
        uint256 totalTokensPrice = _amount * ticketPrice;
        prizePool += _amount * tokenPrice(1);
        require(tokensBalance(msg.sender) >= totalTokensPrice,"Your token balance is not enough to buy this amount of Lottery tickets.");
        // Transferencia de tokens al SC.
        _transfer(msg.sender, address(this), totalTokensPrice);
        // Minteo de los tickets para el usuario
        for (uint256 i; i < _amount; i++) {
            // Declaramos el número random y el controlador único
            bool unique = false;
            uint256 random;
            // Generamos boletos hasta que este sea único.
            while (!unique) {
                random = uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, randNonce))) % 100000;
                randNonce++;
                // comprobamos que el boleto sea único
                if (ticket_owner[random] == address(0)) { unique = true; }
            }
            // Almacenamos el jugador en el array en caso de no estar
            if (owner_tickets[msg.sender].length == 0) { players.push(msg.sender); }
            // Almacenamiento de los datos del boleto enlazado al usuario
            owner_tickets[msg.sender].push(random);
            // Almacenamiento de los datos de los boletos
            generatedTickets.push(random);
            // Asignación del número del boleto a su Owner.
            ticket_owner[random] = msg.sender;
            // Creación de un nuevo NFT para ese número de boleto
            NFTTickets(NFTContract).TicketMint(msg.sender, random);
        }
    }

    // Visualización de los boletos del usuario
    function getTickets(address _address) public view returns (uint256[] memory) {
        return owner_tickets[_address];
    }

    // Generacion del ganador de la loteria (not onlyOwner)
    function getLotteryWinner() public {
        // Generamos un número aleatorio entre el total de tickets comprados
        uint256 totalTickets = generatedTickets.length;
        // Verificamos si se ha vendido al menos 1 boleto
        require(totalTickets > 0, "There are not ticket bought.");
        // Elección aleatoria entre 0 y el número total de boletos comprados
        uint256 random = uint256(uint256(keccak256(abi.encodePacked(block.timestamp))) % totalTickets);
        // Selección del número aleatorio
        winnerNumber = generatedTickets[random];
        // Dirección del ganador
        winnerAddress = ticket_owner[winnerNumber];
        // Envío del 95% de la recaudación de la lotería al ganador
        uint256 prize = (prizePool / 100) * 95;
        payable(winnerAddress).transfer(prize);
        // Envío del beneficio al Owner
        uint256 fee = prizePool - prize;
        payable(owner()).transfer(fee);
        // Guardamos la info del ganador
        Records memory current_lottery = Records(block.timestamp, winnerAddress, winnerNumber, prizePool);
        winners_history.push(current_lottery);
        // Vaciado de la PoolPrize
        prizePool = 0;
        //delete owner_tickets (mapping)
        for (uint i=0; i<players.length; i++) {
            delete owner_tickets[players[i]];
        }
        //delete ticket_owner (mapping) y quema de los NFTs
        for (uint x=0; x<generatedTickets.length; x++) {
            ticket_owner[generatedTickets[x]] = address(0);
            NFTTickets(NFTContract).ticketBurn(generatedTickets[x]);
        }
        //Delete tickets and players array
        delete generatedTickets;
        delete players;
    }
}

// Smart Contract de NFTs
contract NFTTickets is ERC721 {
    
    // Datos relevantes del propietario
    struct Contract {
        address lotteryContractAddress;
        address NFTTicketsContractAddress;
    }

    Contract public contractData;

    constructor(address _lotteryContract) ERC721("Lottery Tickets", "LTICK") {
        contractData = Contract(_lotteryContract, address(this));
    }

    // Creación de los NFTs
    function TicketMint(address _owner, uint256 _ticket) public {
        // Esta función al ser llamada en un contrato declarado SIN HERENCIA
        // debe ser pública, no sirve como internal.
        // Si es el contrato principal el que llama a esta función y la dirección de ESTE contrato
        // es la dirección del contrato NFTTicket del owner permitimos el mint
        require((msg.sender == contractData.lotteryContractAddress),"You are not allowed to mint these NFTs.");
        _safeMint(_owner, _ticket);
    }

    // Quemado de los NFTs
    function ticketBurn(uint256 _ticket) public {
        require((msg.sender == contractData.lotteryContractAddress),"You are not allowed to burn these NFTs.");
        _burn(_ticket);
    }
}
