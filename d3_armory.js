var apiKey = null;

$(function() {
	apiKey = localStorage.getItem('apiKey');
	if (!apiKey) {
		apiKey = prompt('Please enter API Key');
		localStorage.setItem('apiKey', apiKey);
	}
});

var toPercent = function(val) {
	return (Math.round(val * 10000) / 100) + ' %';
};

var GetData = function(heroId) {
	var battleTag = $('#btag').val(),
		setItemTooltip = function(item, td) {
			var storedTooltip = localStorage.getItem(item.tooltipParams),
				fillTooltip = function(itemJson) {
					var ttText = td.html();
					if (itemJson.attributesRaw.Ancient_Rank && itemJson.attributesRaw.Ancient_Rank.max > 0) {
						ttText += '&nbsp(ancien)';
					}
					if (itemJson.isSeasonRequiredToDrop) {
						ttText += '&nbsp;<img src="seasonal-leaf-small.png"/>';
					}
					if (itemJson.armor && itemJson.armor.max > 0) {
						ttText += '<br/>'+itemJson.armor.max.toLocaleString()+' armure';
					}
					if (itemJson.dps && itemJson.dps.max > 0) {
						ttText += '<br/>'+(Math.round(itemJson.dps.max*100)/100).toLocaleString()+' DPS';
						ttText += ' ('+itemJson.minDamage.max.toLocaleString()+' - '+itemJson.maxDamage.max.toLocaleString()+' @ '+(Math.round(itemJson.attacksPerSecond.max*100)/100).toLocaleString()+' APS)';
					}
					for (var i = 0; i < itemJson.attributes.primary.length; i++) {
						ttText += '<br/>'+itemJson.attributes.primary[i].text;
					}
					for (var i = 0; i < itemJson.attributes.secondary.length; i++) {
						ttText += '<br/>'+itemJson.attributes.secondary[i].text;
					}
					for (var i = 0; i < itemJson.gems.length; i++) {
						ttText += '<br/>'+itemJson.gems[i].item.name;
						var first = true;
						for (var j = 0; j < itemJson.gems[i].attributes.primary.length; j++) {
							if (first) {
								ttText += ' (';
								first = false;
							} else {
								ttText += ' / ';
							}
							ttText += itemJson.gems[i].attributes.primary[j].text;
						}
						for (var j = 0; j < itemJson.gems[i].attributes.secondary.length; j++) {
							if (first) {
								ttText += ' (';
								first = false;
							} else {
								ttText += ' / ';
							}
							ttText += itemJson.gems[i].attributes.secondary[j].text;
						}
						for (var j = 0; j < itemJson.gems[i].attributes.passive.length; j++) {
							if (first) {
								ttText += ' (';
								first = false;
							} else {
								ttText += ' / ';
							}
							ttText += itemJson.gems[i].attributes.passive[j].text;
						}
						if (!first) {
							ttText += ')';
						}
					}
					td.html(ttText);
				};
			if (storedTooltip) {
				fillTooltip(JSON.parse(storedTooltip));
			} else {
				$.ajax({
					url : 'https://eu.api.battle.net/d3/data/'+item.tooltipParams+'?locale=fr_FR&apikey='+apiKey,
					success: function(itemJson) {
						localStorage.setItem(item.tooltipParams, JSON.stringify(itemJson));
						fillTooltip(itemJson);
					},
					dataType: 'jsonp'
				});
			}
		},
		fillTable = function(json) {
			var cells = ['heroName', 'heroClass', 'heroLevel', 'heroParagon', 'heroSeason', 'heroDps', 'heroAS', 'heroCritChance', 'heroCritDamage', 'heroDamageIncrease', 'heroArmor',
				'heroLife', 'heroToughness', 'heroLifePerSec', 'heroLifeOnHit', 'heroLifeOnKill', 'heroLifeSteal', 'heroBlockChance', 'heroBlockMin', 'heroBlockMax', 'heroDamageReduc',
				'heroStrength', 'heroDex', 'heroVitality', 'heroIntel',
				'heroResistPhysical', 'heroResistFire', 'heroResistCold', 'heroResistLightning', 'heroResistPoison', 'heroResistArcane',
				'heroThorns', 'heroGoldFind', 'heroMagicFind', 'heroPrimRes', 'heroSecRes'],
				dataLocation = ['name', 'class', 'level', 'paragonLevel', function(jsonData) {
					if (jsonData.seasonCreated) {
						return jsonData.seasonCreated;
					} else {
						return 'N.A.';
					}
				}, ['stats', 'damage'], ['stats', 'attackSpeed'], function(jsonData) { return toPercent(jsonData.stats.critChance); }, function(jsonData) { return toPercent(jsonData.stats.critDamage); },
				['stats', 'damageIncrease'], ['stats', 'armor'], ['stats', 'life'], ['stats', 'toughness'], ['stats', 'healing'], ['stats', 'lifeOnHit'], ['stats', 'lifePerKill'], ['stats', 'lifeSteal'],
				function(jsonData) { return toPercent(jsonData.stats.blockChance); }, ['stats', 'blockAmountMin'], ['stats', 'blockAmountMax'], ['stats', 'damageReduction'],
				['stats', 'strength'], ['stats', 'dexterity'], ['stats', 'vitality'], ['stats', 'intelligence'],
				['stats', 'physicalResist'], ['stats', 'fireResist'], ['stats', 'coldResist'], ['stats', 'lightningResist'], ['stats', 'poisonResist'], ['stats', 'arcaneResist'],
				['stats', 'thorns'], function(jsonData) { return toPercent(jsonData.stats.goldFind); }, function(jsonData) { return toPercent(jsonData.stats.magicFind); },
				['stats', 'primaryResource'], ['stats', 'secondaryResource']],
				toonLocations = {'toonHead': 'head', 'toonShoulder': 'shoulders', 'toonAmulet': 'neck', 'toonTorso': 'torso', 'toonHands': 'hands', 'toonBracers': 'bracers', 'toonWaist': 'waist',
					'toonRingLeft': 'leftFinger', 'toonRingRight': 'rightFinger', 'toonLegs': 'legs', 'toonFeet': 'feet', 'toonWeapon': 'mainHand', 'toonOffHand': 'offHand'};
			localStorage.setItem(battleTag+'-'+heroId, JSON.stringify(json));
			$('#tblHero').css('display', 'table');
			for (var i = 0; i < cells.length; i++) {
				var val = '';
				if (typeof(dataLocation[i]) === 'string') {
					val = json[dataLocation[i]];
				} else if (typeof(dataLocation[i]) === 'function') {
					val = dataLocation[i](json);
				} else if (typeof(dataLocation[i]) === 'object') {
					val = json;
					for (var j = 0; j < dataLocation[i].length; j++) {
						val = val[dataLocation[i][j]];
					}
				}
				if (typeof(val) === 'number') {
					val = (Math.round(val * 100) / 100).toLocaleString();
				}
				$('#'+cells[i]).text(val);
			}
			var toon = $('#divToon');
			for (var c in toonLocations) {
				var td = $('#'+c);
				var item = json.items[toonLocations[c]];
				if (!item) {
					td.removeAttr('class');
					td.html('&#x2718;');
					continue;
				}
				td.html('<span class="item_'+item.displayColor+'">'+item.name+'</span>');
				if (item.tooltipParams.indexOf('item/') === 0) {
					setItemTooltip(item, td);
				}
			}
			toon.css('display', 'block');
		},
		storedHero;
	if (!battleTag || !heroId) {
		return;
	}
	storedHero = localStorage.getItem(battleTag+'-'+heroId);
	if (storedHero != null) {
		fillTable(JSON.parse(storedHero));
	} else {
		$.ajax({
			url : 'https://eu.api.battle.net/d3/profile/'+battleTag+'/hero/'+heroId+'?locale=fr_FR&apikey='+apiKey,
			success: fillTable,
			dataType: 'jsonp'
		});
	}
};

var GetProfile = function() {
	var battleTag = $('#btag').val(),
		storedProfile = localStorage.getItem(battleTag),
		fillProfile = function(json, status) {
			var invalidateCache = false;
			if (jsonStoredProfile) {
				if (jsonStoredProfile.lastUpdated < json.lastUpdated) {
					invalidateCache = true;
					localStorage.setItem(battleTag, JSON.stringify(json));
				}
			} else {
				invalidateCache = true;
				localStorage.setItem(battleTag, JSON.stringify(json));
			}
			var profileDiv = $('#lstHeroes');
			profileDiv.css('display', 'block');
			profileDiv.html('');
			$('#divSeasons').css('display', 'block');
			var nonSeason = $('<div></div>', { id: 'divNonSeason' }).appendTo(profileDiv);
			var season = $('<div></div>', { id: 'divSeason' }).appendTo(profileDiv);
			$('<span>Non Season :</span>').appendTo(nonSeason);
			$('<span>Season :</span>').appendTo(season);
			var ulNonSeason = $('<ul></ul>').appendTo(nonSeason);
			var ulSeason = $('<ul></ul>').appendTo(season);
			var lastPlayed = json.lastHeroPlayed;
			for (var i = 0; i < json.heroes.length; i++) {
				var heroe = json.heroes[i];
				if (invalidateCache) {
					localStorage.removeItem(battleTag+'-'+heroe.id);
				}
				$('<li></li>', {
					text : heroe.name+' '+heroe.level+' ('+heroe.paragonLevel+ (heroe.seasonCreated ? ('S' + heroe.seasonCreated) : '') + ')',
					'data-heroid': heroe.id,
					click: function() {
						GetData($(this).attr('data-heroid'));
						return false;
					},
					'class': heroe.class + (heroe.id == lastPlayed ? ' lastHero' : '')}).appendTo(heroe.seasonal ? ulSeason : ulNonSeason);
			}
			$('#tblSeasons > tbody > tr:not(#trSeasonsHeader)').remove();
			var lines = '';
			for (var s in json.seasonalProfiles) {
				lines += '<tr>';
				lines += '<td class="center">' + json.seasonalProfiles[s].seasonId + '</td>';
				lines += '<td class="nb">' + json.seasonalProfiles[s].paragonLevel.toLocaleString() + '</td>';
				lines += '<td class="nb">' + json.seasonalProfiles[s].kills.monsters.toLocaleString() + '</td>';
				lines += '<td class="nb">' + json.seasonalProfiles[s].kills.elites.toLocaleString() + '</td>';
				lines += '<td class="center">' + (json.seasonalProfiles[s].progression.act1 ? '&#x2714;' : '&#x2718;') + '</td>';
				lines += '<td class="center">' + (json.seasonalProfiles[s].progression.act2 ? '&#x2714;' : '&#x2718;') + '</td>';
				lines += '<td class="center">' + (json.seasonalProfiles[s].progression.act3 ? '&#x2714;' : '&#x2718;') + '</td>';
				lines += '<td class="center">' + (json.seasonalProfiles[s].progression.act4 ? '&#x2714;' : '&#x2718;') + '</td>';
				lines += '<td class="center">' + (json.seasonalProfiles[s].progression.act5 ? '&#x2714;' : '&#x2718;') + '</td>';
				lines += '</tr>';
			}
			$('#tblSeasons').append($(lines));
		},
		jsonStoredProfile = null;
	$('#tblHero').css('display', 'none');
	$('#divToon').css('display', 'none');
	if (storedProfile != null) {
		jsonStoredProfile = JSON.parse(storedProfile);
	}
	$.ajax({
		url : 'https://eu.api.battle.net/d3/profile/'+battleTag+'/?locale=fr_FR&apikey='+apiKey,
		success: fillProfile,
		dataType: 'jsonp'
	});
};
