var fs = require('fs');
var path = require('path');
var moment = require('moment');

var defaultShop = '{"itemList":[' +
'{"item":"Kick" , "desc":"Kick a member of your choice! (Limit: 5/day)" , "price":"5"},' +
'{"item":"Declare" , "desc":"Declare a message of your choice (Can be refused)" , "price":"10"},' +
'{"item":"Mute" , "desc":"Mute a member of your choice for 7 minutes (Can only be used 1/member)" , "price":"15"},' +
'{"item":"Rank Up" , "desc":"Get promoted by ONE rank for 24 hours (Can be taken away)" , "price":"30"}],'+
'"bank":"Yggdrasil Guardian"}';

/**
 * Gets an amount and returns the amount with the name of the currency.
 *
 * @examples
 * currencyName(0); // 0 bucks
 * currencyName(1); // 1 buck
 * currencyName(5); // 5 bucks
 *
 * @param {Number} amount
 * @returns {String}
 */
function currencyName(amount) {
	var name = " buck";
	return amount === 1 ? name : name + "s";
}

/**
 * Log money to logs/money.txt file.
 *
 * @param {String} message
 */
function logMoney(message,roomName) {
	if (!message) return;
	var file = path.join(__dirname, '../logs/leagueshops/'+roomName+'shop.txt');
	var date = "[" + new Date().toUTCString() + "] ";
	var msg = message + "\n";
	fs.appendFile(file, date + msg);
}

/**
 * Checks if the money input is actually money.
 *
 * @param {String} money
 * @return {String|Number}
 */
function isMoney(money) {
	var numMoney = Number(money);
	if (isNaN(money)) return "Must be a number.";
	if (String(money).includes('.')) return "Cannot contain a decimal.";
	if (numMoney < 1) return "Cannot be less than one buck.";
	return numMoney;
}

/**
 * Find the item in the shop.
 *
 * @param {String} item
 * @param {Number} money
 * @return {Object}
 */
function findItem(item, money, shop) {
	var len = shop.itemList.length;
	var price = 0;
	var amount = 0;
	while (len--) {
		if (item.toLowerCase() !== shop.itemList[len].item.toLowerCase()) continue;
		price = shop.itemList[len].price;
		if (price > money) {
			amount = price - money;
			this.sendReply("You don't have you enough money for this. You need " + amount + currencyName(amount) + " more to buy " + item + ".");
			return false;
		}
		return price;
	}
	this.sendReply(item + " not found in shop.");
}

exports.commands = {

/***********************
	Set Gym Leader
***********************/

	sgl: 'setgymleader',
	setgymleader: function (target, room, user) {
		if (!this.can('makeroom') && room.auth[user.userid] != '#') return;
		if(!room.chatRoomData.isLeague) return this.sendReply('Can only be used in a League room');
		if (!target) return this.sendReply('/setgymleader [type], [user] - Adds user to GL list');
		var targetsArray = target.split(',');
		var target1 = toId(targetsArray[0]).charAt(0).toUpperCase() + toId(targetsArray[0]).slice(1).toLowerCase();
		var target2 = targetsArray[1];
		target1 = target1.charAt(0).toUpperCase() + target1.slice(1).toLowerCase();
		var leagueName = room.title;
		
		if(target1 != 'Fairy' && target1 != 'Bug' && target1 != 'Dragon' && target1 != 'Psychic' && target1 != 'Water' && target1 != 'Fire' && target1 != 'Grass' && target1 != 'Ground' && target1 != 'Rock' && target1 != 'Dark' && target1 != 'Ice' && target1 != 'Electric' && target1 != 'Flying' && target1 != 'Normal' && target1 != 'Poison' && target1 != 'Ghost' && target1 != 'Steel' && target1 != 'Fighting') return this.sendReply ('Please select a valid type');
		if (fs.existsSync('storage-files/'+toId(leagueName)+'gymleaders.json')) {
            		var gymleaderlist = JSON.parse(fs.readFileSync('storage-files/'+toId(leagueName)+'gymleaders.json'));
			gymleaderlist[target1] = target2;
  			fs.writeFile('storage-files/'+toId(leagueName)+'gymleaders.json', JSON.stringify(gymleaderlist));
        	}else{
            		fs.writeFileSync('storage-files/'+toId(leagueName)+'gymleaders.json', '{}');
            		var gymleaderlist = JSON.parse(fs.readFileSync('storage-files/'+toId(leagueName)+'gymleaders.json'));
		    	gymleaderlist[target1] = target2;
  		    	fs.writeFile('storage-files/'+toId(leagueName)+'gymleaders.json', JSON.stringify(gymleaderlist));
        	}
		
		this.sendReply(target2 + ' has now been set as ' + target1 + ' Gym Leader for ' + leagueName + '.');
		
		return;
	},
	
/***********************
	View Gym Leader
***********************/

	vgl: 'viewgymleaders',
	viewgymleaders: function (target, room, user) {
		if (!this.canBroadcast()) return;
		if(!room.chatRoomData.isLeague) return this.sendReply('Can only be used in a League room');
		var roomName = toId(room.title);
		if (fs.existsSync('storage-files/'+roomName+'gymleaders.json')) { 
  			var gymleaderlist = JSON.parse(fs.readFileSync('storage-files/'+roomName+'gymleaders.json'));
		}else{
			return this.sendReply ('League hasn\'t set up a Gym Leader list.');
		}
		
		var glList = '<center><b>'+room.title+' Gym Leaders.</b><br/><table><tr><td><b>Type</b></td><td><b>Gym Leader<b></td><td><b>Last Seen</b></td></tr><br/>';
		for (type in gymleaderlist) {
		    var targetUser = Users.get(gymleaderlist[type]);
		    var seen = Seen[toId(gymleaderlist[type])];
		    var lastSeen;
		    if(!seen){
		        lastSeen = 'never.'
		    }else{
		        lastSeen = (targetUser && targetUser.connected) ? '<font color = "green"> online.</font>' : moment(seen).fromNow();
		    }
			glList += '<tr><td>' + '<img src="http://play.pokemonshowdown.com/sprites/types/' + type + '.png">' + '</td>' + '<td>' + gymleaderlist[type] + ': ' + '</td>' + '<td>' + lastSeen + '</td>' + '</tr>';
		}
		this.sendReplyBox(glList + '</table>');
		return;
	},
	
	
/***********************
	League Shop
***********************/

    leagueshop: function(target, room, user, connection){
        if (!this.canBroadcast()) return;
        if(!room.chatRoomData.isLeague) return this.sendReply('Can only be used in a League room');
        var targets = target.split(',');
        if(targets[0] != 'view' && targets[0] != 'list' && targets[0] != 'add' && targets[0] != 'delete' && targets[0] != 'remove' && targets[0] != 'viewlog' && targets[0] != 'bank' && targets[0] != 'buy' && targets[0] != 'help') return this.sendReply('/leagueshop help - List available /leagueshop commands.');
        if(targets[0] == 'help'){
            return this.sendReplyBox('|raw|The following is a list of league shop commands:<br/>'+
                            '/leagueshop view/list - Shows a complete list of the shop items.<br/>'+
                            '/leagueshop add, [item name], [description], [price] - Adds an item to the shop.<br/>'+
                            '/leagueshop delete/remove, [item name] - Removes an item from the shop.<br/>'+
                            '/leagueshop buy, [item name] - Purchase an item from the shop.<br/>'+
                            '/leagueshop viewlog, [number of lines] - Views the last 15 lines in the shop log.<br/>'+
                            '/leagueshop bank, [username] - Sets the room bank to [username]. The room bank receives all funds from the puchases in the shop.')
        }
        var roomName = toId(room.title);
        if (fs.existsSync('storage-files/'+roomName+'shop.json')) {
  			var shop = JSON.parse(fs.readFileSync('storage-files/'+roomName+'shop.json'));
		}else{
		    var shop = JSON.parse(defaultShop);
			fs.writeFileSync('storage-files/'+roomName+'shop.json', defaultShop);
			var shop = JSON.parse(fs.readFileSync('storage-files/'+roomName+'shop.json'));
		}
		if(targets[0] == 'view' || targets[0] == 'list'){
		    var shopList = '<div><center><h2><u>'+room.title+'\'s Shop.</h2></u><br/><table cellpadding="6" border="1"><tr><td align="center"><h3><u>Item</h3></u></td><td align="center"><h3><u>Description</h3></u></td><td align="center"><h3><u>Price</h3></u></td></tr><br/>';
    		for (var i = 0; i < shop.itemList.length; i++){
    		    var item = shop.itemList[i].item;
    		    var desc = shop.itemList[i].desc;
    		    var price = shop.itemList[i].price;
    		    shopList += '<tr>' + 
    		        '<td align="center"><button name="send" value="/leagueshop buy, '+ item + '">' + item + '</button>' + '</td>' + 
    		        '<td align="center">'+  desc + '</td>' + 
    		        '<td align="center">' + price + '</td>' + 
    		        '</tr>';
    		}
    		shopList += '</center></div><br/>'
    		return this.sendReplyBox(shopList);
		}
		if(targets[0] == 'buy'){
		    var item = targets[1].replace(' ','');
		    var _this = this;
		    Database.read('money', user.userid, function (err, amount) {
    			if (err) throw err;
    			if (!amount) amount = 0;
    			var cost = findItem.call(_this, item, amount, shop);
    			if (!cost) return room.update();
    			if(!shop.bank){
    			    Database.write('money', amount - cost, user.userid, function (err, total) {
        				if (err) throw err;
        				_this.sendReply("You have bought " + item + " for " + cost +  currencyName(cost) + ". You now have " + total + currencyName(total) + " left.");
        				room.addRaw(user.name + " has bought <b>" + item + "</b> from the shop.");
        				logMoney(user.name + " has bought " + item + " from the shop. This user now has " + total + currencyName(total) + ".", roomName);
        				var msg = '**' + user.name + " has bought " + item + ".**";
                		for (var i in Users.users) {
                			if (room.auth[Users.users[i]] === '#') {
                				Users.users[i].send('|pm|~Shop Alert|' + Users.users[i].getIdentity() + '|' + msg);
                			}
                		}
        				room.update();
    			    });
    			}else{
    			    Database.read('money', toId(shop.bank), function (err, amount) {
        			if (err) throw err;
        			if (!amount) amount = 0;
        			var cost = findItem.call(_this, item, amount, shop);
        			cost = isMoney(cost);
        			//amount = isMoney(amount);
					if(!Number(amount)) amount = 0;
        			if (!cost) return room.update();
        			    Database.write('money', amount + cost, toId(shop.bank), function (err, total) {
            				if (err) throw err;
            				//_this.sendReply('Bank has been given '+cost);
    			        });
    			    });
    			    Database.write('money', amount - cost, user.userid, function (err, total) {
        				if (err) throw err;
        				_this.sendReply("You have bought " + item + " for " + cost +  currencyName(cost) + ". You now have " + total + currencyName(total) + " left.");
        				room.addRaw(user.name + " has bought <b>" + item + "</b> from the shop.");
        				logMoney(user.name + " has bought " + item + " from the shop. This user now has " + total + currencyName(total) + ".", roomName);
        				var msg = '**' + user.name + " has bought " + item + ".**";
                		for (var i in Users.users) {
                			if (room.auth[Users.users[i]] === '#') {
                				Users.users[i].send('|pm|~Shop Alert|' + Users.users[i].getIdentity() + '|' + msg);
                			}
                		}
        				room.update();
    			    });
    			}
    			
    		});
		}
		if(targets[0] == 'add'){
			if (room.auth[user.userid] != '#') return;
		    var item = targets[1].replace(' ','');
		    var desc = targets[2].slice(1);
		    var price = targets[3].replace(' ','');
		    shop.itemList.push({"item":item,"desc":desc,"price":price});
		    fs.writeFile('storage-files/'+roomName+'shop.json', JSON.stringify(shop));
		    return this.sendReply('Added new item to the shop');
		    //return this.sendReply(item + ' ' + desc + ' ' + price);
		}
		if(targets[0] == 'delete' || targets[0] == 'remove'){
			if (room.auth[user.userid] != '#') return;
		    var item = targets[1].replace(' ','');
		    var len = shop.itemList.length;
		    while (len--) {
		        if (item.toLowerCase() !== shop.itemList[len].item.toLowerCase()) continue;
		        shop.itemList.remove(shop.itemList[len]);
		        fs.writeFile('storage-files/'+roomName+'shop.json', JSON.stringify(shop));
		        return this.sendReply('Removed '+item+' from the shop');
		    } 
		}
		if(targets[0] == 'viewlog'){
		    if (room.auth[user.userid] != '#') return;
    		var numLines = 15;
    		if(targets[1] && isNaN(targets[1])) return this.sendReply('Please use a number to define how many lines.')
    		if(targets[1]) numLines = targets[1];
    		var matching = true;
    		var topMsg = "Displaying the last " + numLines + " lines of transactions:\n";
    		var file = path.join(__dirname, '../logs/leagueshops/'+roomName+'shop.txt');
    		fs.exists(file, function (exists) {
    			if (!exists) return connection.popup("No transactions.");
    			fs.readFile(file, 'utf8', function (err, data) {
    				data = data.split('\n');
    				connection.popup('|wide|' + topMsg + data.slice(-(numLines + 1)).join('\n'));
    			});
    		});
		}
		if(targets[0] == 'bank'){
		    shop.bank = toId(targets[1]);
		    fs.writeFile('storage-files/'+roomName+'shop.json', JSON.stringify(shop));
		    return this.sendReply('League shop bank has been set to '+shop.bank);
		}
    }
};
