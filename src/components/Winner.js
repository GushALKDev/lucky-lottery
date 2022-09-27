import React, { Component } from 'react';
import smart_contract from '../abis/Lottery.json';
import Web3 from 'web3';
import Swal from 'sweetalert2';

import Navigation from './Navbar';
import { Spinner } from 'react-bootstrap';
// import MyCarousel from './Carousel';

class Winner extends Component {

  async componentDidMount() {
    document.title = "Winner - Lucky Lottery"
    // 1. Carga de Web3
    await this.loadWeb3()
    // 2. Carga de datos de la Blockchain
    await this.loadBlockchainData()
    // 3. Actualización de las variables de la Blockchain
    await this._getLotteryHistory();
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
      loading: false,
      contract: null,
      errorMessage: "",
      lotteryHistory: []
    }
  }

  _getLotteryWinner = async () => {
    //console.log('Ejecutando getLotteryWinner()...')
    try {
      this.setState({ loading: true })
      await this.state.contract.methods.getLotteryWinner().send({ from: this.state.account })
      const _winnerAddress = await this.state.contract.methods.winnerAddress().call()
      const _winnerNumber = await this.state.contract.methods.winnerNumber().call()
      Swal.fire({
        icon: 'success',
        title: `Winner Ticket: ${_winnerNumber}`,
        width: 800,
        padding: '3em',
        text: `Owner: ${_winnerAddress}`,
        backdrop: `
              rgba(15, 238, 168, 0.2)
              left top
              no-repeat
            `
      }).then(() => window.location.reload())
    } catch (err) {
      this.setState({ errorMessage: err })
    } finally {
      this.setState({ loading: false })
    }
  }

  _getLotteryHistory = async () => {
    try {
      const delay = ms => new Promise(res => setTimeout(res, ms));
      await delay(1000);
      const _loteryHistory = await this.state.contract.methods.getLotteryRecords().call()
      this.setState({ lotteryHistory: _loteryHistory });
      console.log(_loteryHistory);
    } catch (err) {
      this.setState({ errorMessage: err })
    } finally {
      this.setState({ loading: false })
    }
  }

  _unixTimeToDateTime = (unixTime) => {
    const milliseconds = unixTime * 1000;
    const dateObject = new Date(milliseconds);
    return dateObject.toLocaleString();
  }

  render() {

    if (this.state.loading) return (
      <div>
        <Navigation account={this.state.account} /><br />
        <div className='loading'>
          <Spinner animation='border' style={{ display: 'flex', margin: 12 }} />
          <p className='mx3 my-0'>Loading blockchain data, wait a moment please...</p>
        </div>
      </div>
    );

    return (
      <div>
        <Navigation account={this.state.account} />
        {/* <MyCarousel /> */}
        <div className="container-fluid mt-5">
          <div className="row">
            <main role="main" className="col-lg-12 d-flex text-center">
              <div className="content mr-auto ml-auto">
                <div className='get-winner'>
                  <div className='get-winner-btn'>
                    <h1>Lottery Winner</h1>
                    <form onSubmit={(event) => {
                      event.preventDefault()
                      this._getLotteryWinner()
                    }}>
                      <input type='submit' className=' winner-btn bbtn btn-block btn-primary btn-sm' value='Get lottery winner!' />
                    </form>
                  </div>
                </div>
                <div>
                  <br />
                  <br />
                  <h3>Lottery History</h3>
                  <table>
                    <tr>
                      <th>DateTime</th>
                      <th>Winner Number</th>
                      <th>Winner Address</th>
                      <th>&nbsp;&nbsp;&nbsp;&nbsp;Prize&nbsp;&nbsp;&nbsp;&nbsp;</th>
                    </tr>
                    {this.state.lotteryHistory.map((item) => (
                      <tr>
                        <td>{this._unixTimeToDateTime(item.timestamp)}</td>
                        <td>{item.number}</td>
                        <td>{item.winner}</td>
                        <td>{item.prize / Math.pow(10, 18) + ' ETH'}</td>
                      </tr>
                    ))}
                  </table>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }
}

export default Winner;
