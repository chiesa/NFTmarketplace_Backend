## NFT MARKETPLACE
Nel progetto si sviluppa un contratto che permette le seguenti funzionalità:
1. `listItem`: List NFTs on the marketplace
2. `buyItem`: List NFTs on th marketplace
3. `cancellItem`: Cancel a listing
4. `updateListing`: Update Price
5. `withdrawProceeds`: Withdraw payment for my bought NFTs

A seguito del deploy e in un contesto di test vengono creati 2 contratti: BasicNFT1.sol e BasicNFT2.sol. Lo scopo è quello di creare due NFT con cui fare i test e quindi si crea anche il file di deploy deploy-test.js.

## TEST
A scopo di test vengono localmente eseguiti i seguienti test sul contratto:
1. listItem:
	- `contratto senza approvazione per il token`: nft.getApproved(_tokenId) non è uguale all'NFTContract => revert NFT_marketplace__invalidNFT()
	- `prezzo 0` => rever NFT_marketplace__invalidPrice();
	- `l'owner del NFT non è msg.sender` => revert NFT_marketplace__ownerChange()
	- `l'NFT è già listato` => revert NFT_marketplace__alreadyList
	- `controllo prezzo e owner`: per l'NFT listato il prezzo (getNFTPrice()) e l'owner (getNFTLister()) sono uguali a quelli passati come parametri
	- `evento NFTlisted`: a seguito di un listaggio evento NFTlisted()	
	
2. buyItem:
	- `contratto senza approvazione per il token`: nft.getApproved(_tokenId) non è uguale all'NFTContract => revert NFT_marketplace__invalidNFT()
  	- `prezzo 0` => revert NFT_marketplace__invalidNFT()
	- `cambio di owner` => revert NFT_marketplace__ownerChange()
	- `importo inviato non valido` => i token inviati sono minori del prezzo => revert NFT_marketplace__invalidPrice()
	- `NFT eliminato`: l'NFT viene eliminato, quindi cercando il prezzo (getNFTPrice()) e verifico che non sia maggiore di 0
	- `incremento credito del venditore`: il credito del venditore è stato aumentato del prezzo di vendita
	- `cambio dell'owner del NFT` 
	- `evento NFTSold`: a seguito di un acquisto evento NFTSold()


3. deleteListing: (tutti uguali ripresi da buyItem)
	- `contratto senza approvazione per il token`: nft.getApproved(_tokenId) non è uguale all'NFTContract => revert NFT_marketplace__invalidNFT()
	- `NFT non listato` => revert NFT_marketplace__invalidNFT()
	- `cambio di owner`: a seguito di un cambio di owner => revert NFT_marketplace__ownerChange()
	- `NFT eliminato`: l'NFT viene eliminato, quindi cercando il prezzo (getNFTPrice()) e verifico che non sia maggiore di 0
	- `evento listDeleted`: a seguito di un delistaggio evento listDeleted()


4. updateListing
	- `cambio di owner`: a seguito di un cambio di owner => revert NFT_marketplace__ownerChange()
	- `sender non è owner`: se msg.sender non è owner => revert NFT_marketplace__ownerChange()
	- `il prezzo è 0` => revert NFT_marketplace__invalidNFT()
	- `evento listingUpdate`: a seguito di un aggiornamento evento listingUpdate()
	
5. whitdraw:
	- `non ci sono withdraw disponibili`
	- `Credito eliminato` => dopo l'esecuzione di whitdraw il credito viene eliminato, saldo = 0
	- `evento withdrawSuccess`: a seguito di un prelievo evento withdrawSuccess()
