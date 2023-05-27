// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract PicMarket {
    struct Pic {
        uint256 id;
        address owner;
        string imageUrl;
        uint256 price;
        uint256 likes;
        uint256 dislikes;
    }

    mapping(uint256 => Pic) public pics;
    uint256 public picCount;

    event PicCreated(uint256 id, address owner, string imageUrl, uint256 price);
    event PicLiked(uint256 id, address liker);
    event PicDisliked(uint256 id, address disliker);
    event TipSent(uint256 id, address tipper, uint256 amount);
    event PicPurchased(uint256 id, address buyer);

    constructor() {
        picCount = 0;
    }

    function createPic(string memory _imageUrl, uint256 _price) public {
        require(bytes(_imageUrl).length > 0, "Image URL cannot be empty");
        require(_price > 0, "Price must be greater than zero");

        picCount++;
        pics[picCount] = Pic(picCount, msg.sender, _imageUrl, _price, 0, 0);
        emit PicCreated(picCount, msg.sender, _imageUrl, _price);
    }

    function likePic(uint256 _id) public {
        require(_id > 0 && _id <= picCount, "Invalid pic ID");

        Pic storage pic = pics[_id];
        pic.likes++;
        emit PicLiked(_id, msg.sender);
    }

    function dislikePic(uint256 _id) public {
        require(_id > 0 && _id <= picCount, "Invalid pic ID");

        Pic storage pic = pics[_id];
        pic.dislikes++;
        emit PicDisliked(_id, msg.sender);
    }

    function sendTip(uint256 _id) public payable {
        require(_id > 0 && _id <= picCount, "Invalid pic ID");
        require(msg.value > 0, "Tip amount must be greater than zero");

        Pic storage pic = pics[_id];
        address payable tipRecipient = payable(pic.owner);
        tipRecipient.transfer(msg.value);

        emit TipSent(_id, msg.sender, msg.value);
    }

    function buyPic(uint256 _id) public payable {
        require(_id > 0 && _id <= picCount, "Invalid pic ID");
        require(msg.value > 0, "Buy amount must be greater than zero");

        Pic storage pic = pics[_id];
        require(msg.value >= pic.price, "Insufficient funds to buy the pic");

        address payable previousOwner = payable(pic.owner);
        pic.owner = msg.sender;
        pic.likes = 0;
        pic.dislikes = 0;
        pic.price = msg.value;

        previousOwner.transfer(msg.value);

        emit PicPurchased(_id, msg.sender);
    }
}
