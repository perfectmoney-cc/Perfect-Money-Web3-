// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IERC20 {
    function transferFrom(address,address,uint256) external returns(bool);
    function transfer(address,uint256) external returns(bool);
    function balanceOf(address) external view returns(uint256);
    function allowance(address,address) external view returns(uint256);
}

/// @title PMNFT - Optimized NFT Marketplace
/// @dev Minimal ERC721 with marketplace, auctions, royalties
contract PMNFT is ERC721, ERC721URIStorage, Ownable, ReentrancyGuard {
    IERC20 public immutable pm;
    uint256 private _tid;
    uint256 public mFee;
    uint256 public pFee;
    address public col;
    bool public paused;
    
    string[] public cats;
    mapping(string=>bool) public vCat;
    mapping(uint256=>L) public ls;
    mapping(uint256=>M) public ms;
    mapping(address=>uint256) public mCnt;
    uint256 public tMint;
    uint256 public tList;
    uint256 public tSale;
    uint256 public tVol;

    struct L{address s;uint256 p;bool a;uint256 e;address b;uint256 h;bool x;}
    struct M{string n;string d;string c;uint256 r;address cr;uint256 t;}

    event Mint(uint256 indexed i,address indexed c,string n,string ct,uint256 r);
    event List(uint256 indexed i,address indexed s,uint256 p,bool a,uint256 e);
    event Delist(uint256 indexed i,address indexed s);
    event Sale(uint256 indexed i,address indexed s,address indexed b,uint256 p);
    event Bid(uint256 indexed i,address indexed b,uint256 a);
    event AEnd(uint256 indexed i,address indexed w,uint256 a);

    error Z();error LB();error LA();error NO();error NL();error LD();error BP();error BR();error BC();error BD();error NE();error ED();error LBd();error NA();error IA();error F();error HF();error CE();error SB();error P();

    constructor(address _p)ERC721("Perfect Money NFT","PMNFT")Ownable(msg.sender){
        if(_p==address(0))revert Z();
        pm=IERC20(_p);col=msg.sender;mFee=10000e18;pFee=2;
        _ac("PM Digital Card");_ac("PM Voucher Card");_ac("PM Gift Cards");
        _ac("PM Partner Badge");_ac("PM Discount Card");_ac("PM VIP Exclusive Card");
    }

    modifier wP(){if(paused)revert P();_;}
    modifier oO(uint256 i){if(ownerOf(i)!=msg.sender)revert NO();_;}
    modifier iA(uint256 i){if(!ls[i].x)revert NL();_;}

    function _ac(string memory c)internal{cats.push(c);vCat[c]=true;}
    
    function _pt(address f,address t,uint256 a)internal{
        if(a==0)return;
        bool ok=f==address(this)?pm.transfer(t,a):pm.transferFrom(f,t,a);
        if(!ok)revert F();
    }

    function mint(string calldata u,string calldata n,string calldata d,string calldata c,uint256 r)external nonReentrant wP returns(uint256){
        if(r>10)revert BR();if(!vCat[c])revert BC();
        if(pm.balanceOf(msg.sender)<mFee)revert LB();
        if(pm.allowance(msg.sender,address(this))<mFee)revert LA();
        uint256 i=_tid++;
        ms[i]=M(n,d,c,r,msg.sender,block.timestamp);
        mCnt[msg.sender]++;tMint++;
        _pt(msg.sender,col,mFee);
        _safeMint(msg.sender,i);_setTokenURI(i,u);
        emit Mint(i,msg.sender,n,c,r);
        return i;
    }

    function listSale(uint256 i,uint256 p)external nonReentrant wP oO(i){
        if(ls[i].x)revert LD();if(p==0)revert BP();
        ls[i]=L(msg.sender,p,false,0,address(0),0,true);tList++;
        _approve(address(this),i,msg.sender);
        emit List(i,msg.sender,p,false,0);
    }

    function listAuct(uint256 i,uint256 p,uint256 dur)external nonReentrant wP oO(i){
        if(ls[i].x)revert LD();if(p==0)revert BP();
        if(dur<1 hours||dur>7 days)revert BD();
        uint256 e=block.timestamp+dur;
        ls[i]=L(msg.sender,p,true,e,address(0),0,true);tList++;
        _approve(address(this),i,msg.sender);
        emit List(i,msg.sender,p,true,e);
    }

    function delist(uint256 i)external nonReentrant iA(i){
        L storage l=ls[i];if(l.s!=msg.sender)revert NO();
        address rb=l.b;uint256 ra=l.h;
        delete ls[i];
        if(rb!=address(0)&&ra>0)_pt(address(this),rb,ra);
        emit Delist(i,msg.sender);
    }

    function buy(uint256 i)external nonReentrant wP iA(i){
        L storage l=ls[i];if(l.a)revert IA();if(l.s==msg.sender)revert SB();
        uint256 p=l.p;address s=l.s;
        if(pm.balanceOf(msg.sender)<p)revert LB();
        if(pm.allowance(msg.sender,address(this))<p)revert LA();
        delete ls[i];
        _pay(i,p,msg.sender,s,false);
        _transfer(s,msg.sender,i);
        emit Sale(i,s,msg.sender,p);
    }

    function bid(uint256 i,uint256 a)external nonReentrant wP iA(i){
        L storage l=ls[i];if(!l.a)revert NA();
        if(block.timestamp>=l.e)revert ED();if(l.s==msg.sender)revert SB();
        uint256 mn=l.h>0?l.h+1:l.p;if(a<mn)revert LBd();
        if(pm.balanceOf(msg.sender)<a)revert LB();
        if(pm.allowance(msg.sender,address(this))<a)revert LA();
        address pb=l.b;uint256 pa=l.h;
        l.b=msg.sender;l.h=a;
        _pt(msg.sender,address(this),a);
        if(pb!=address(0)&&pa>0)_pt(address(this),pb,pa);
        emit Bid(i,msg.sender,a);
    }

    function endAuct(uint256 i)external nonReentrant iA(i){
        L storage l=ls[i];if(!l.a)revert NA();if(block.timestamp<l.e)revert NE();
        address s=l.s;address w=l.b;uint256 wb=l.h;
        delete ls[i];
        if(w==address(0)){emit AEnd(i,address(0),0);return;}
        _pay(i,wb,w,s,true);_transfer(s,w,i);
        emit AEnd(i,w,wb);emit Sale(i,s,w,wb);
    }

    function _pay(uint256 i,uint256 p,address by,address sl,bool fc)internal{
        M memory m=ms[i];
        uint256 pf=(p*pFee)/100;
        uint256 r=(m.cr!=sl&&m.r>0)?(p*m.r)/100:0;
        uint256 sa=p-pf-r;
        address src=fc?address(this):by;
        _pt(src,col,pf);if(r>0)_pt(src,m.cr,r);_pt(src,sl,sa);
        tSale++;tVol+=p;
    }

    function getLs(uint256 i)external view returns(L memory){return ls[i];}
    function getMs(uint256 i)external view returns(M memory){return ms[i];}
    function getCats()external view returns(string[] memory){return cats;}
    function getSt()external view returns(uint256,uint256,uint256,uint256){return(tMint,tList,tSale,tVol);}
    function aEnd(uint256 i)external view returns(bool){L memory l=ls[i];return l.x&&l.a&&block.timestamp>=l.e;}
    function tLeft(uint256 i)external view returns(uint256){L memory l=ls[i];return(!l.x||!l.a||block.timestamp>=l.e)?0:l.e-block.timestamp;}

    function setMFee(uint256 f)external onlyOwner{mFee=f;}
    function setPFee(uint256 p)external onlyOwner{if(p>10)revert HF();pFee=p;}
    function setCol(address c)external onlyOwner{if(c==address(0))revert Z();col=c;}
    function addCat(string calldata c)external onlyOwner{if(vCat[c])revert CE();_ac(c);}
    function wd(uint256 a)external onlyOwner{_pt(address(this),msg.sender,a);}
    function setPause(bool p)external onlyOwner{paused=p;}

    function tokenURI(uint256 i)public view override(ERC721,ERC721URIStorage)returns(string memory){return super.tokenURI(i);}
    function supportsInterface(bytes4 f)public view override(ERC721,ERC721URIStorage)returns(bool){return super.supportsInterface(f);}
}
