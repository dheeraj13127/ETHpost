const { assert } = require('chai')
const { default: Web3 } = require('web3')

const Tipogram=artifacts.require('./Tipogram.sol')
require('chai')
.use(require('chai-as-promised'))
.should()

contract('Tipogram',([deployer,creator,tipper])=>{
    let tipogram
    before(async()=>{
        tipogram=await Tipogram.deployed()
    })
    describe('deployment',async()=>{
        it('deploys it successfully',async()=>{
            const address= await tipogram.address
            assert.notEqual(address,0x0)
            assert.notEqual(address,'')
            assert.notEqual(address,null)
            assert.notEqual(address,undefined)
        })

        it('Correct name',async()=>{
            const name=await tipogram.name()
            assert.equal(name,'Tipogram')
        })
    })
    describe('Images',async()=>{
        let result,imageCount
        before(async()=>{
            result=await tipogram.uploadImage('hash','Image description',{from:creator})
            imageCount=await tipogram.imageCount()
        })
        it('imageCount is coorect',async()=>{
            assert.equal(imageCount,1)
        })
        it('creates images',async()=>{
            const event=result.logs[0].args
            assert.equal(event.id.toNumber(),imageCount.toNumber(),'id is correct')
            assert.equal(event.hash,'hash','hash is correct')
            assert.equal(event.description,'Image description','description is correct')
            assert.equal(event.author,creator,'author is correct')

            await tipogram.uploadImage('','Image description',{from:creator}).should.be.rejected
            await tipogram.uploadImage('hash','',{from:creator}).should.be.rejected
        })
        it('lists images',async()=>{
            const image=await tipogram.images(imageCount)
            assert.equal(image.id.toNumber(),imageCount.toNumber(),'id is correct')
            assert.equal(image.hash,'hash','hash is correct')
            assert.equal(image.description,'Image description','description is correct')
            assert.equal(image.author,creator,'author is correct')

        })
        it('allows users to tip posts',async()=>{
                let oldAuthorBalance
                oldAuthorBalance=await web3.eth.getBalance(creator)
                oldAuthorBalance=new web3.utils.BN(oldAuthorBalance)
                results=await tipogram.tipImage(imageCount,{from:tipper,value:web3.utils.toWei('1','Ether')})

                //success
                const event=results.logs[0].args
                assert.equal(event.id.toNumber(),imageCount.toNumber(),'id is correct')
                assert.equal(event.hash,'hash','hash is correct')
                assert.equal(event.description,'Image description','description is correct')
                assert.equal(event.author,creator,'author is correct')

                //Check author recieved funds
                let newAuthorBalance
                newAuthorBalance=await web3.eth.getBalance(creator)
                newAuthorBalance=new web3.utils.BN(newAuthorBalance)

                let tipImageOwner
                tipImageOwner=web3.utils.toWei('1','Ether')
                tipImageOwner=new web3.utils.BN(tipImageOwner)

                const expectedBalance=oldAuthorBalance.add(tipImageOwner)

                assert.equal(newAuthorBalance.toString(),expectedBalance.toString())


                //FAilure incase tipeer tries to tip image that doesnot exist
                await tipogram.tipImage(99,{from:tipper,value:web3.utils.toWei('1','Ether')}).should.be.rejected
                
        })
      
    })
})