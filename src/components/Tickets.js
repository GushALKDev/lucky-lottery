import React, { Component } from 'react';
import smart_contract from '../abis/Lottery.json';
import Web3 from 'web3';
import Swal from 'sweetalert2';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { Container } from 'react-bootstrap';
import { Spinner } from 'react-bootstrap';

import Navigation from './Navbar';
// import MyCarousel from './Carousel';

class Lottery extends Component {

  async componentDidMount() {
    document.title = "Tickets - Lucky Lottery"
    // 1. Carga de Web3
    await this.loadWeb3()
    // 2. Carga de datos de la Blockchain
    await this.loadBlockchainData()
    // 3. Actualización de las variables de la Blockchain
    await this.updateData();
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

  async updateData() {
    const delay = ms => new Promise(res => setTimeout(res, ms));
    await delay(1000);
    this._getOwner();
    this._getVariables();
  }

  constructor(props) {
    super(props)
    this.state = {
      account: '0x0',
      owner: '0x0',
      loading: false,
      contract: null,
      errorMessage: "",
      ticketPrice: 0,
      tokensBalanceSC: 'Loading...',
      ethersBalanceSC: 'Loading...',
      tokensBalance: 'Loading...',
      ticketPriceLabel: "Loading...",
      prizePool: "Loading...",
      myTickets: [],
      maxTickets: 0,
      NFTContractAddress: 'Loading...',
      lotteryContractAddress: 'Loading...',
      generatedTickets: [],
      players: []
    }
  }

  _getOwner = async () => {
    try {
      const _owner = await this.state.contract.methods.owner().call();
      this.setState({ owner: _owner});
    } catch (err) {
      this.setState({ errorMessage: err })
    } finally {
      this.setState({ loading: false })
    }
  }

  _getVariables = async () => {
    try {
      const web3 = window.web3;
      const _tokensBalance = await this.state.contract.methods.tokensBalance(this.state.account).call();
      this.setState({ tokensBalance: _tokensBalance + " Tokens" });
      const _ticketPrice = await this.state.contract.methods.ticketPrice().call();
      this.setState({ ticketPrice: _ticketPrice });
      this.setState({ ticketPriceLabel: "1 Ticket = " + _ticketPrice + " Token" });
      const _prizePool = await this.state.contract.methods.prizePool().call();
      this.setState({prizePool: web3.utils.fromWei(_prizePool.toString(), 'ether') + " ETH" });
      const _maxTickets = _tokensBalance / _ticketPrice;
      this.setState({ maxTickets: _maxTickets });
      const _myTickets = await this.state.contract.methods.getTickets(this.state.account).call();
      this.setState({ myTickets: _myTickets });
      const _tokensBalanceSC = await this.state.contract.methods.tokensBalanceSC().call();
      this.setState({tokensBalanceSC: _tokensBalanceSC + " Tokens" });
      const _ethersBalanceSC = await this.state.contract.methods.ethersBalanceSC().call();
      this.setState({ethersBalanceSC: web3.utils.fromWei(_ethersBalanceSC.toString(), 'ether') + " ETH" });
      const _NFTContractAddress = await this.state.contract.methods.NFTContract().call();
      this.setState({NFTContractAddress: _NFTContractAddress});
      const _lotteryContractAddress = await this.state.contract.methods.lotteryContract().call();
      this.setState({lotteryContractAddress: _lotteryContractAddress});
      const _generatedTickets = await this.state.contract.methods.getGeneratedTickets().call();
      this.setState({generatedTickets: _generatedTickets});
      const _players = await this.state.contract.methods.getPlayers().call();
      this.setState({players: _players});
      (this.state.owner === this.state.account) ? (this.setState({isOwner: true})) : (this.setState({isOwner: false}));
    } catch (err) {
      this.setState({ errorMessage: err })
    } finally {
      this.setState({ loading: false })
    }
  }

  _buyTickets = async (_amount) => {
    try {
      this.setState({ loading: true })
      const total = _amount * 1
      await this.state.contract.methods.buyTickets(_amount).send({ from: this.state.account })
      Swal.fire({
        icon: 'success',
        title: 'NFT Tickets bought successfully!!',
        width: 800,
        padding: '3em',
        text: `You bought ${_amount} NFT Tickets by ${total} Tokens`,
        backdrop: `
                  rgba(15, 238, 168, 0.2)
                  left top
                  no-repeat
                `
      })
      this.updateData();
    } catch (err) {
      this.setState({ errorMessage: err })
    } finally {
      this.setState({ loading: false })
    }
  }

  render() {
    if (this.state.loading) return (
      <div>
        <Navigation account={this.state.account} /><br />
        <div  className='loading'>
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
                <h1>NFT Lottery Tickets Management</h1>
                &nbsp;
                <Container>
                  <Row>
                    <Col>
                      <h3>Balance</h3>
                      <h4>{this.state.tokensBalance}</h4>
                      <hr />
                      <h3>Tickets Price</h3>
                      <h4>{this.state.ticketPriceLabel}</h4>
                      <hr />
                      <h3>Prize Pool</h3>
                      <h4>{this.state.prizePool}</h4>
                      {/* <form onSubmit={(event) => {
                                                event.preventDefault()
                                                this._ticketPrice()
                                            }}>
                                                <input type='submit'
                                                    className='bbtn btn-block btn-info btn-sm'
                                                    value='Show Price' />
                                            </form> */}
                    </Col>
                    <Col>
                      <h3>My Tickets</h3>
                      <div className='myTickets'>
                        {this.state.myTickets.map((item) => (
                          <div className='ticket'> {item} </div>
                        ))}
                      </div>
                      {/* <form onSubmit={(event) => {
                                                event.preventDefault()
                                                this._myTickets()
                                            }}>
                                                <input type='submit'
                                                    className='bbtn btn-block btn-primary btn-sm'
                                                    value='Show my NFT Lottery Tickets' />
                                            </form> */}
                    </Col>
                  </Row>
                  &nbsp;
                  <div className='buy_tickets'>
                    <h3>Buy NFT Lottery Tickets</h3>
                    <form onSubmit={(event) => {
                      event.preventDefault()
                      const _amount = this._amount.value
                      this._buyTickets(_amount)
                    }}>
                      <input type='number'
                        className='form-control mb-1'
                        placeholder={`You can buy up to ${this.state.maxTickets} tickets with your current balance`}
                        ref={(input) => this._amount = input} />
                      <input type='submit'
                        className='bbtn btn-block btn-success btn-sm'
                        value='Buy NFT Lottery Tickets' />
                    </form>
                  </div>
                </Container>
                  <div className='center-container'>
                  { (this.state.owner === this.state.account) ? (<div><br />
                    <hr /><h4>Debug info</h4><hr />
                    <div>Smart Contract´s Tokens Balance: {this.state.tokensBalanceSC}</div>
                    <div>Smart Contract´s Ethers Balance: {this.state.ethersBalanceSC}</div>
                    <div>Lottery Contract Address: {this.state.lotteryContractAddress}</div>
                    <div>NFT Contract Address: {this.state.NFTContractAddress}</div>
                    <div>Current Players: {this.state.players.map((player) => (<>({player}) </>))}</div>
                    <div>Sold tickets: {this.state.generatedTickets.map((ticket) => (<>({ticket}) </>))}</div>
                    </div>)
                  : ('')}
                  </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }
}

export default Lottery;
