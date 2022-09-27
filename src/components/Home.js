import React, { Component } from 'react';
import smart_contract from '../abis/Lottery.json';
import Web3 from 'web3';
import tokens_tab from '../img/tokens_tab.png';
import tickets_tab from '../img/tickets_tab.png';
import lottery_winner from '../img/lottery_winner.png';
import Navigation from './Navbar';

class Winner extends Component {

    async componentDidMount() {
        document.title = "Home - Lucky Lottery"
        // 1. Carga de Web3
        await this.loadWeb3()
        // 2. Carga de datos de la Blockchain
        await this.loadBlockchainData()
    }

    // 1. Carga de Web3
    async loadWeb3() {
        if (window.ethereum) {
            window.web3 = new Web3(window.ethereum)
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            console.log('Accounts: ', accounts)
        }
        else if (window.web3) {
            window.web3 = new Web3(window.web3.currentProvider)
        }
        else {
            window.alert('¡Deberías considerar usar Metamask!')
        }
    }

    // 2. Carga de datos de la Blockchain
    async loadBlockchainData() {
        const web3 = window.web3
        const accounts = await web3.eth.getAccounts()
        this.setState({ account: accounts[0] })
        // Ganache -> 5777, Rinkeby -> 4, BSC -> 97
        const networkId = await web3.eth.net.getId()
        console.log('networkid:', networkId)
        const networkData = smart_contract.networks[networkId]
        console.log('NetworkData:', networkData)

        if (networkData) {
            const abi = smart_contract.abi
            console.log('abi', abi)
            const address = networkData.address
            console.log('address:', address)
            const contract = new web3.eth.Contract(abi, address)
            this.setState({ contract })
        } else {
            window.alert('¡El Smart Contract no se ha desplegado en la red!')
        }

        window.ethereum.on('chainChanged', (chainID) => {
            window.location.reload();
          });
      
          window.ethereum.on('accountsChanged', async function (accounts) {
            window.location.reload();
          });
      
    }

    constructor(props) {
        super(props)
        this.state = {
            account: '0x0',
            loading: true,
            contract: null,
            errorMessage: ""
        }
    }

    render() {
        return (
            <div>
                <Navigation account={this.state.account} />
                {/* <MyCarousel /> */}
                <div className="content">
                    <h1> Lucky Lottery instructions<br /><br /></h1>
                    <h4>IMPORTANT!!! THE SMART CONTRACTS ARE DEPLOYED ON ROPSTEN NETWORK<br /><br /></h4>
                    <div className='home_content'>
                        <p>Welcome to Lucky Lottery!!! To get tickets to participate in the game, you have to buy ERC-20 tokens first at <a href='tokens'>"Tokens"</a> tab. The price of each ERC-20 token is 0.01 ETH</p>
                        <a href='tokens'><img src={tokens_tab} className='home_images'/></a>
                        <p>After that, you are able to get Lottery tickets, buying 1 ticket by 1 ERC-20 token at <a href='tickets'>"Tickets"</a> tab.</p>
                        <a href='tickets'><img src={tickets_tab} className='home_images'/></a>
                        <br />
                        <br />
                        <p>Once you have bought your Lottery Tickets you will be elegible to win the lottery. The winner will be revealed when someone request it, clicking the "Get lottery winner" button at the <a href='winner'>"Winner"</a> tab.</p>
                        <div className='center'><a href='winner'><img src={lottery_winner} className='home_images'/></a></div>
                    </div>
                </div>
            </div>
        );
    }
}

export default Winner;
