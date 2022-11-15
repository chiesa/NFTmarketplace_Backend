// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

/* ---- Import ---*/
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

/* ---- Error ---*/
error NFT_marketplace__NotPermition();
error NFT_marketplace__invalidNFT(uint token);
error NFT_marketplace__invalidPrice();
error NFT_marketplace__alreadyList();
error NFT_marketplace__ownerChange(address oldOwner, address newOwner);
error NFT_marketplace__invalidWithdraw();

contract NFTmarketplace{
    /* ---- Variabili ---*/
    //address internal immutable i_owner;
    // map addressNFT -> tokenId -> owner + price
    mapping(address => mapping (uint => SingleNFT)) private s_listing;
    struct SingleNFT{
        address sender;
        uint price;
    }
    // address -> amount
    mapping (address => uint) internal s_credit;

    /* ---- eventi ---*/
    event NFTlisted(address _NFTContract, uint _tokenId, uint _price, address seller);
    event NFTSold(address from , address to, uint _tokenId, address _nftAddress);
    event listDeleted(address _NFTContract, uint _tokenId, address seller);
    event withdrawSuccess(address _to, uint amount);

    /* ---- modifier ---*/
    /*modifier ownerOnly(address sender){
        if(sender != i_owner){
            revert NFT_marketplace__NotPermition();
        }
        _;
    }*/
    bool locked = false;
    modifier LockFunction(){
        require(!locked, "Impossible call the function");
        locked = true; 
        _;
        locked = false;
    }
    //check if is approved the marketplace
    modifier approved(address _NFTContract, uint _tokenId){
        IERC721 nft = IERC721(_NFTContract);
        if( nft.getApproved(_tokenId) == _NFTContract ){
            revert NFT_marketplace__invalidNFT(_tokenId);
        }
        _;
    }
    modifier validPrice(address _NFTContract, uint _tokenId){
        if( s_listing[_NFTContract][_tokenId].price <= 0){
            revert NFT_marketplace__invalidPrice();
        }
        _;
    }

    // check valid NFT owner
    modifier validOwner(address _NFTContract, uint _tokenId, address _sender){
        IERC721 nft = IERC721(_NFTContract);
        address NFTRealOwner = nft.ownerOf(_tokenId);
        if( NFTRealOwner != _sender ){
            revert NFT_marketplace__ownerChange(_sender,NFTRealOwner);
        }
        _;
    }
    // check if is already listed
    modifier alreadyList(address _NFTContract, uint _tokenId){
        if( s_listing[_NFTContract][_tokenId].price > 0 ){
            revert NFT_marketplace__alreadyList();
        }
        _;
    }
    // check if NFT owner is change
    modifier correctOwner(address _NFTContract, uint _tokenId){
        IERC721 nft = IERC721(_NFTContract);
        address NFTowner = s_listing[_NFTContract][_tokenId].sender;
        address NFTRealOwner = nft.ownerOf(_tokenId);
        if( NFTRealOwner != NFTowner ){
            revert NFT_marketplace__ownerChange(NFTowner,NFTRealOwner);
        }
        _;
    }
    modifier NoWithdrawAvaible(address _sender){
        uint amount = s_credit[_sender]; 
        // check if have something to send
        if( amount <= 0 ){
            revert NFT_marketplace__invalidWithdraw();
        }
        _;
    }



    /* ---- costruttore ---
    constructor(){
        i_owner = msg.sender;
    }*/

    /* ---- function ---*/
    function listItem(address _NFTContract, uint _tokenId, uint _price) external 
    approved(_NFTContract, _tokenId)
    alreadyList(_NFTContract, _tokenId)
    validOwner(_NFTContract, _tokenId, msg.sender)
    {
        if( _price <= 0){
            revert NFT_marketplace__invalidPrice();
        }
    
        // listing
        s_listing[_NFTContract][_tokenId] = SingleNFT(msg.sender, _price);
        // event
        emit NFTlisted( _NFTContract, _tokenId, _price, msg.sender);
    }

    function buyItem(address _NFTContract, uint _tokenId) external payable
    LockFunction()
    approved(_NFTContract, _tokenId)
    validPrice(_NFTContract, _tokenId)
    //correctOwner(_NFTContract, _tokenId) => manda in errore la compilazione massimo 3 modifier
    {
        // riscrittura correctOwner
        IERC721 nft = IERC721(_NFTContract);
        address NFTowner = s_listing[_NFTContract][_tokenId].sender;
        address NFTRealOwner = nft.ownerOf(_tokenId);
        if( NFTRealOwner != NFTowner ){
            revert NFT_marketplace__ownerChange(NFTowner,NFTRealOwner);
        }
        // check if amount is correct for buy
        if( msg.value < s_listing[_NFTContract][_tokenId].price){
            revert NFT_marketplace__invalidPrice();
        }        
    
        // delete listing
        delete(s_listing[_NFTContract][_tokenId]);
        // add money to the seller
        s_credit[NFTowner] = msg.value;
        // NFT safe transfert
        nft.safeTransferFrom(NFTowner,msg.sender,_tokenId);
        // emit
        emit NFTSold(NFTowner,msg.sender,_tokenId,_NFTContract);
    }

    function deleteListing(address _NFTContract, uint _tokenId) external 
    approved(_NFTContract, _tokenId)
    validPrice(_NFTContract, _tokenId)
    validOwner(_NFTContract, _tokenId, msg.sender)
    {
        // delete listed
        delete(s_listing[_NFTContract][_tokenId]);
        // emit
        emit listDeleted( _NFTContract, _tokenId, msg.sender);
    }

    function updateListing(address _NFTContract, uint _tokenId, uint _price) external 
    LockFunction()
    validOwner(_NFTContract, _tokenId, msg.sender)
    correctOwner(_NFTContract, _tokenId)
    {
        // check valid price
        if( _price <= 0){
            revert NFT_marketplace__invalidPrice();
        }
     
        //update price
        s_listing[_NFTContract][_tokenId].price = _price;

        //emit
        emit NFTlisted( _NFTContract, _tokenId, _price,msg.sender);

    }

    // inquanto ho un invio di soldi voglio ReentrancyGuard
    function withdraw() external payable 
    LockFunction()
    NoWithdrawAvaible(msg.sender)
    {
        uint amount = s_credit[msg.sender]; 
        // delete amount
        delete(s_credit[msg.sender]);
        // send money (with call)
        (bool success,)= (msg.sender).call{value: amount}("");
        // emit
        if(!success){
            revert NFT_marketplace__invalidWithdraw();
        }
        emit withdrawSuccess(msg.sender, amount);
    }

    /* ---- GET Function ---*/
    function getNFTPrice(address _NFTContract, uint _tokenId) public view returns(uint){
        return s_listing[_NFTContract][_tokenId].price;
    }

    function getNFTLister(address _NFTContract, uint _tokenId) public view returns(address){
        return s_listing[_NFTContract][_tokenId].sender;
    }

    function getAccountBalance(address account) public view returns(uint){
        return s_credit[account];
    }

}