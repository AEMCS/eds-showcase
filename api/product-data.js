export async function getProductData() {

  return {
   response : {
    "took": 1,
    "timed_out": false,
    "_shards": {
        "total": 1,
        "successful": 1,
        "skipped": 0,
        "failed": 0
    },
    "hits": {
        "total": {
            "value": 1,
            "relation": "eq"
        },
        "max_score": null,
        "hits": [
            {
                "_index": "products-en_augbnz-20260430172352",
                "_id": "087125662479055000228000016GBENBF0426",
                "_score": null,
                "_source": {
                    "assortmentCode": "BF0426",
                    "countryCode": "GB",
                    "filename": "gs://prd-api-v2-service-ingest-bucket-prod/current/gb_en_BF0426_5000228000016_pas_1772176141661.xlsx",
                    "hasFrontMobileImages": "true",
                    "header": {
                        "@context": "https://schema.org/",
                        "@type": "Product",
                        "additionalProperty": [
                            {
                                "@type": "PropertyValue",
                                "name": "Ingredients",
                                "value": "Ingredients: Pasta (64%) (durum WHEAT semolina, WHEAT flour), flavourings (contain CELERY), iodised salt, chicken (4.6%) [chicken, vegetable oil (palm), salt, antioxidants (ascorbyl palmitate, alpha-tocopherol)], starch, yeast extract, chicken fat (2.5%) [chicken fat, antioxidant (extracts of rosemary)], toasted onion powder (2%), potassium chloride, sugar, salt, spices (CELERY seeds, turmeric, pepper), parsley. May contain egg, milk, mustard, soy and other cereals containing gluten."
                            },
                            {
                                "@type": "PropertyValue",
                                "name": "HowToUse",
                                "value": "<h3>For 1.5 pints:</h3>\n<ol><li><p>Empty contents of the sachet into saucepan.</p></li>\n<li><p>Gradually add 850ml of cold water, stirring constantly.</p></li>\n<li><p>Bring to the boil and reduce the heat, partially cover and simmer for 5 minutes, stirring occasionally.</p></li>\n<li><p>Serve and enjoy!</p></li></ol>\n\n<h3>For 2.5 pints:</h3>\n<ol><li><p>Empty contents of the sachet into saucepan.</p></li>\n<li><p>Gradually add 1.5 litres of cold water, stirring constantly.</p></li>\n<li><p>Bring to the boil and reduce the heat, partially cover and simmer for 5 minutes, stirring occasionally.</p></li>\n<li><p>Serve and enjoy!</p></li></ol>"
                            }
                        ],
                        "aggregateRating": {
                            "@type": "AggregateRating",
                            "ratingValue": 4.2,
                            "reviewCount": 51
                        },
                        "brand": {
                            "@type": "Brand",
                            "name": "Knorr"
                        },
                        "category": "About our Chicken Noodle Soup",
                        "countryOfOrigin": {
                            "@type": "Country",
                            "name": "France"
                        },
                        "description": "Enjoy oodles of noodles and the taste of succulent chicken in this delicious warming soup - a real crowd-pleaser with children and grown-ups alike. Perfect at lunch, dinner or whenever you feel like a simple, tasty treat in a bowl.",
                        "gtin": "08712566247905",
                        "image": {
                            "@type": "ImageObject",
                            "url": {
                                "@id": "https://assets.unileversolutions.com/v2/w600/ch-retailer/web/PvmNq0RpRKquXxVSQqz7TA/144540565.jpeg"
                            }
                        },
                        "name": "Chicken Noodle Soup",
                        "review": [
                            {
                                "@type": "Review",
                                "author": {
                                    "@type": "Person",
                                    "name": "Richard"
                                },
                                "datePublished": "2026-02-08T01:50:22.376Z",
                                "name": "A staple in our home",
                                "reviewBody": "This soup has been in the family for years. My mum passed in 2022 and this was a staple when she couldn't eat solids or enjoy them. I would boil potatoes and add to the soup for her and she loved it. It was as another reviewer described, a little gem. \n\nFlash forward to 2026 and I recently had my gallbladder removed and I find it tough to eat anything but knorr chicken noodle is perfect I add a bit of extra pasta to increase the carbs and I'm so grateful for it. Nostalgic and essential ☺️",
                                "reviewRating": {
                                    "@type": "Rating",
                                    "ratingValue": 5
                                }
                            },
                            {
                                "@type": "Review",
                                "author": {
                                    "@type": "Person",
                                    "name": "Kelly"
                                },
                                "datePublished": "2026-01-27T19:11:06.012Z",
                                "name": "A gem 💎",
                                "reviewBody": "My dad first introduced me to this soup in 1986. I was 6 and he made a whole chicken in the Crockpot with Knorr chicken noodle soup as the base stock with some garlic and red peppers and LOTS of chilli flakes. My god did it burn our bums off. But it was DELICIOUS. Crusty bread dipped in the Knorr soup in the bottom with chicken juices. Now 45 and still do this dish. A big fave\n thanks for the memories Knorr. ",
                                "reviewRating": {
                                    "@type": "Rating",
                                    "ratingValue": 5
                                }
                            },
                            {
                                "@type": "Review",
                                "author": {
                                    "@type": "Person",
                                    "name": "Jas1"
                                },
                                "datePublished": "2026-01-04T00:13:31.675Z",
                                "name": "Love it",
                                "reviewBody": "Knorr Chicken Noodle Soup is one of the very best and most versatile soups in the UK from simply enjoying the soup to using it as a base for other recipes. The very minute I detect a cold coming on, I reach for a packet and it heats me up and cheers me up with memories of happy years long gone. I was VERY disappointed to see Morrisons no longer sell it but I will go the one of their competitors to buy it. ",
                                "reviewRating": {
                                    "@type": "Rating",
                                    "ratingValue": 5
                                }
                            },
                            {
                                "@type": "Review",
                                "author": {
                                    "@type": "Person",
                                    "name": "martin"
                                },
                                "datePublished": "2025-12-12T12:44:38.552Z",
                                "name": "ewww",
                                "reviewBody": "This soup was nasty; it's like the person making it couldn't stop adding flavors, and they don't complement each other at all.",
                                "reviewRating": {
                                    "@type": "Rating",
                                    "ratingValue": 1
                                }
                            },
                            {
                                "@type": "Review",
                                "author": {
                                    "@type": "Person",
                                    "name": "Mee Mee"
                                },
                                "datePublished": "2025-11-07T10:14:52.656Z",
                                "name": "DISAPPOINTED Where is the flavour ",
                                "reviewBody": "Bought Super Chicken soup from Sainsburys last week. My Grandaughter chose it for tea on Tuesday. What a disappointment… followed the instructions adding packet contents to boiling water. When we tasted it… just noodles and water… no chicken flavour.  Tried to complain on line but it was a waste of time.",
                                "reviewRating": {
                                    "@type": "Rating",
                                    "ratingValue": 1
                                }
                            },
                            {
                                "@type": "Review",
                                "author": {
                                    "@type": "Person",
                                    "name": "Sash"
                                },
                                "datePublished": "2025-10-26T12:37:44.162Z",
                                "name": "It's not the same",
                                "reviewBody": "Just tastes like slightly salted water, it's definitely not the same as it used to be, really disappointing. I used to live of this stuff and been craving it for a while too, wish I never bothered cause I've bought like 10 packs of the stuff!",
                                "reviewRating": {
                                    "@type": "Rating",
                                    "ratingValue": 2
                                }
                            },
                            {
                                "@type": "Review",
                                "author": {
                                    "@type": "Person",
                                    "name": "Steven"
                                },
                                "datePublished": "2025-06-03T17:41:53.897Z",
                                "name": "Delicious ",
                                "reviewBody": "I've been eating this soup since I was a small boy and even now after more than 3 decades I still enjoy it.\nOnly realized now that you can buy it in bulk.\nEasy to make for a lazy meal after a hard day's work.\nI've got one boiling away on the hob right now.\n",
                                "reviewRating": {
                                    "@type": "Rating",
                                    "ratingValue": 5
                                }
                            },
                            {
                                "@type": "Review",
                                "author": {
                                    "@type": "Person",
                                    "name": "Jennifer "
                                },
                                "datePublished": "2025-05-18T14:32:50.496Z",
                                "name": "Knorr chicken soup",
                                "reviewBody": "Bought this for a hot savoury drink but I would have been better off adding hot water to salt.\nThe noodles sank to the bottom of the cup then eventually went soggy,  the bits floating at the top were like pieces of sponge,  just awful \n",
                                "reviewRating": {
                                    "@type": "Rating",
                                    "ratingValue": 1
                                }
                            },
                            {
                                "@type": "Review",
                                "author": {
                                    "@type": "Person",
                                    "name": "Sxsky"
                                },
                                "datePublished": "2025-01-01T18:05:02.623Z",
                                "name": "Horrible ",
                                "reviewBody": "I’ve had the chicken noodle soup since I was a kid, went to have it today and it looked like a plate of dishwater, tasted horrible , it was greasy and tasted funny. This used to be one of the tastiest packet soups around, that and the French onion soup were great when I was not well, but sadly after today I’ll defo not be buying it again. Don’t know what you’ve done to it but it really needs to back to what we used to get. ",
                                "reviewRating": {
                                    "@type": "Rating",
                                    "ratingValue": 1
                                }
                            },
                            {
                                "@type": "Review",
                                "author": {
                                    "@type": "Person",
                                    "name": "REBB"
                                },
                                "datePublished": "2024-10-30T22:55:26.262Z",
                                "name": "Love knorrs Chicken noodle",
                                "reviewBody": "I love this soup I have been eating it for years, nice tasty flavour, with just enough noodle to make a small meal! I have just been declared Diabetic and it's so hard to find low sugar foods, this is a great one, there is sugar but unlike others this is on the low side, also this doesn't have added spice which makes others inedible. \n",
                                "reviewRating": {
                                    "@type": "Rating",
                                    "ratingValue": 5
                                }
                            }
                        ],
                        "sku": "8712566247905",
                        "url": "https://www.knorr.com/uk/p/chicken-noodle-soup.html/08712566247905"
                    },
                    "ipglnCode": "5000228000016",
                    "languageCode": "EN",
                    "longKey": "087125662479055000228000016GBENBF0426",
                    "productData": {
                        "Variant": "SUPER CHICKEN NOODLE",
                        "aggregateRating": 4.2,
                        "approvalDate": "2017-09-20T17:02:35",
                        "assets": [
                            {
                                "aemVisibilityEnabled": "Yes",
                                "altText": "Chicken Noodle Soup",
                                "assetBrand": "Knorr",
                                "assetID": "144540565",
                                "assetSubtype": "Front",
                                "assetType": "Pack Shot",
                                "contentURL": "https://assets.unileversolutions.com/v2/w600/ch-retailer/web/PvmNq0RpRKquXxVSQqz7TA/144540565.jpeg",
                                "countriesAvailableTo": "United Kingdom,Ireland",
                                "dateCreated": "2025-12-23T09:46:50",
                                "dateModified": "2026-01-15T20:46:04",
                                "fileType": "TIF",
                                "previewURL": "https://assets.unileversolutions.com/v2/w128/thumb/PvmNq0RpRKquXxVSQqz7TA/144540565.jpeg",
                                "usageRightsType": "None (Not licensed, no restrictions)"
                            },
                            {
                                "aemVisibilityEnabled": "Yes",
                                "assetBrand": "Knorr",
                                "assetID": "144540562",
                                "assetSubtype": "Back",
                                "assetType": "Pack Shot",
                                "contentURL": "https://assets.unileversolutions.com/v2/w600/ch-retailer/web/z_CUE7_DQZO4ZEBhlm_m_A/144540562.jpeg",
                                "countriesAvailableTo": "United Kingdom,Ireland",
                                "dateCreated": "2025-12-23T09:46:49",
                                "dateModified": "2026-01-15T14:41:24",
                                "fileType": "TIF",
                                "previewURL": "https://assets.unileversolutions.com/v2/w128/thumb/z_CUE7_DQZO4ZEBhlm_m_A/144540562.jpeg",
                                "usageRightsType": "None (Not licensed, no restrictions)"
                            }
                        ],
                        "brand": "Knorr",
                        "category": "Scratch Cooking Aids",
                        "categoryCode": "CF1070",
                        "categoryGroup": "Nutrition",
                        "claimsStatement": "Serves 4|Free from colours and preservatives|Product as sold. Prepared product as in the cooking instruction. Portion. % of Reference Intake of an average adult (8400kJ/2000kcal)",
                        "combinedBrandSKLSearchTerms": "chicken noodle soup,chicken soup,Instant Soup,low fat soup,minestrone soup,noodle soup,Packet Soup,soup,soup mix,soup pack,soups,tomato soup,vegetable soup",
                        "consumerFirstAvailabilityDateTime": "2011-09-16T00:00:00",
                        "consumerUsageStorageInstructions": "Store in a cool, dry place.",
                        "countryOfOrigin": "France",
                        "descriptionShort": "Knorr Soup Sach ChickenNoodle 12x51g",
                        "descriptiveSize": "4x 51 g",
                        "eVariant": "Super Chicken Noodle",
                        "ecommerceImages": "144540565 (Front)\n144540562 (Back)",
                        "ecommerceWebImages": "144540565 (Front)\n144540562 (Back)",
                        "equivalentProduct": [
                            {
                                "@id": "08712566248186"
                            },
                            {
                                "@id": "08712566247851"
                            },
                            {
                                "@id": "08712566247868"
                            }
                        ],
                        "featuresAndBenefits": "Knorr Super Chicken Noodle Soup Mix is a tasty and versatile soup that is fast to prepare in just 5 minutes. Great taste is in our nature, and this packet soup has been created with chicken and oodles of noodles. Simply bring 900 ml of water to the boil, add the contents of the sachet, stir and simmer, then enjoy this delicious, warming soup. Knorr Super Chicken Noodle Soup Mix is free from artificial colours and preservatives. Knorr is in partnership with sustainable agriculture meaning a great taste and high-quality ingredients that go into our stocks, gravies, soups and seasonings. For a heartier soup, add your favourite veggies.",
                        "foodIngredientStatement": "Ingredients: Pasta (64%) (durum WHEAT semolina, WHEAT flour), flavourings (contain CELERY), iodised salt, chicken (4.6%) [chicken, vegetable oil (palm), salt, antioxidants (ascorbyl palmitate, alpha-tocopherol)], starch, yeast extract, chicken fat (2.5%) [chicken fat, antioxidant (extracts of rosemary)], toasted onion powder (2%), potassium chloride, sugar, salt, spices (CELERY seeds, turmeric, pepper), parsley. May contain egg, milk, mustard, soy and other cereals containing gluten.",
                        "globalBrandCode": "BF0426",
                        "goesWellWith": [
                            "08712566248186",
                            "08712566247851",
                            "08712566247868",
                            "05000184161165",
                            "08722700043119"
                        ],
                        "gtin": "08712566247905",
                        "gtinWithoutCheckDigit": "00871256624790",
                        "hasAllergen": [
                            {
                                "allergenDescription": {
                                    "@value": "Celery and their derivates"
                                },
                                "allergenLevelOfContainmentCode": {
                                    "@id": "gs1:LevelOfContainmentCode-BC"
                                },
                                "allergenTypeCode": {
                                    "@value": "BC"
                                },
                                "levelOfContainment": {
                                    "@value": "CONTAINS"
                                }
                            },
                            {
                                "allergenDescription": {
                                    "@value": "Cereals containing gluten and their derivates"
                                },
                                "allergenLevelOfContainmentCode": {
                                    "@id": "gs1:LevelOfContainmentCode-AW"
                                },
                                "allergenTypeCode": {
                                    "@value": "AW"
                                },
                                "levelOfContainment": {
                                    "@value": "CONTAINS"
                                }
                            },
                            {
                                "allergenDescription": {
                                    "@value": "Eggs and their derivates"
                                },
                                "allergenLevelOfContainmentCode": {
                                    "@id": "gs1:LevelOfContainmentCode-AE"
                                },
                                "allergenTypeCode": {
                                    "@value": "AE"
                                },
                                "levelOfContainment": {
                                    "@value": "MAY_CONTAIN"
                                }
                            },
                            {
                                "allergenDescription": {
                                    "@value": "Mustard and its derivates"
                                },
                                "allergenLevelOfContainmentCode": {
                                    "@id": "gs1:LevelOfContainmentCode-BM"
                                },
                                "allergenTypeCode": {
                                    "@value": "BM"
                                },
                                "levelOfContainment": {
                                    "@value": "MAY_CONTAIN"
                                }
                            },
                            {
                                "allergenDescription": {
                                    "@value": "Milk and its derivates"
                                },
                                "allergenLevelOfContainmentCode": {
                                    "@id": "gs1:LevelOfContainmentCode-AM"
                                },
                                "allergenTypeCode": {
                                    "@value": "AM"
                                },
                                "levelOfContainment": {
                                    "@value": "MAY_CONTAIN"
                                }
                            },
                            {
                                "allergenDescription": {
                                    "@value": "Rye and its derivates"
                                },
                                "allergenLevelOfContainmentCode": {
                                    "@id": "gs1:LevelOfContainmentCode-NR"
                                },
                                "allergenTypeCode": {
                                    "@value": "NR"
                                },
                                "levelOfContainment": {
                                    "@value": "MAY_CONTAIN"
                                }
                            },
                            {
                                "allergenDescription": {
                                    "@value": "Soybeans and their derivates"
                                },
                                "allergenLevelOfContainmentCode": {
                                    "@id": "gs1:LevelOfContainmentCode-AY"
                                },
                                "allergenTypeCode": {
                                    "@value": "AY"
                                },
                                "levelOfContainment": {
                                    "@value": "MAY_CONTAIN"
                                }
                            },
                            {
                                "allergenDescription": {
                                    "@value": "Triticale and their derivatives"
                                },
                                "allergenLevelOfContainmentCode": {
                                    "@id": "gs1:LevelOfContainmentCode-TR"
                                },
                                "allergenTypeCode": {
                                    "@value": "TR"
                                },
                                "levelOfContainment": {
                                    "@value": "MAY_CONTAIN"
                                }
                            },
                            {
                                "allergenDescription": {
                                    "@value": "Oats"
                                },
                                "allergenLevelOfContainmentCode": {
                                    "@id": "gs1:LevelOfContainmentCode-GO"
                                },
                                "allergenTypeCode": {
                                    "@value": "GO"
                                },
                                "levelOfContainment": {
                                    "@value": "MAY_CONTAIN"
                                }
                            },
                            {
                                "allergenDescription": {
                                    "@value": "Wheat and its derivates"
                                },
                                "allergenLevelOfContainmentCode": {
                                    "@id": "gs1:LevelOfContainmentCode-UW"
                                },
                                "allergenTypeCode": {
                                    "@value": "UW"
                                },
                                "levelOfContainment": {
                                    "@value": "CONTAINS"
                                }
                            },
                            {
                                "allergenDescription": {
                                    "@value": "Barley and barley products (gluten containing grain)"
                                },
                                "allergenLevelOfContainmentCode": {
                                    "@id": "gs1:LevelOfContainmentCode-GB"
                                },
                                "allergenTypeCode": {
                                    "@value": "GB"
                                },
                                "levelOfContainment": {
                                    "@value": "MAY_CONTAIN"
                                }
                            }
                        ],
                        "ingredientStatement": "Pasta (64%) (durum WHEAT semolina, WHEAT flour), flavourings (contain CELERY), iodised salt, chicken (4.6%) [chicken, vegetable oil (palm), salt, antioxidants (ascorbyl palmitate, alpha-tocopherol)], starch, yeast extract, chicken fat (2.5%) [chicken fat, antioxidant (extracts of rosemary)], toasted onion powder (2%), potassium chloride, sugar, salt, spices (CELERY seeds, turmeric, pepper), parsley. May contain egg, milk, mustard, soy and other cereals containing gluten.",
                        "ingredientsDisclaimer": "% of Reference Intake of an average adult (8400kJ/2000kcal).",
                        "isActiveInMarket": "false",
                        "isEcommProduct": "true",
                        "isRetailerAssorted": "true",
                        "materialNumber": "000000000017830202",
                        "nutritionalClaimStatement": "Serves 4|Free from colours and preservatives|Product as sold. Prepared product as in the cooking instruction. Portion. % of Reference Intake of an average adult (8400kJ/2000kcal)",
                        "nutritionalInformation": {
                            "numberOfServingsPerPackage": "4",
                            "nutrientDetail": [
                                {
                                    "measurementPrecisionCode": "APPROXIMATELY",
                                    "nutrientDescription": "Carbohydrate",
                                    "nutrientTypeCode": "CHOAVL",
                                    "quantityContained": "3.3",
                                    "quantityContainedUOM": "gram",
                                    "servingInstance": "per 100ml",
                                    "upstreamQuantityContained": "3.3"
                                },
                                {
                                    "dailyValueIntakePercent": "3",
                                    "measurementPrecisionCode": "APPROXIMATELY",
                                    "nutrientDescription": "Carbohydrate",
                                    "nutrientTypeCode": "CHOAVL",
                                    "quantityContained": "7.6",
                                    "quantityContainedUOM": "gram",
                                    "servingInstance": "per serving",
                                    "upstreamDailyValueIntakePercent": "3",
                                    "upstreamQuantityContained": "7.6"
                                },
                                {
                                    "measurementPrecisionCode": "LESS_THAN",
                                    "nutrientDescription": "Carbohydrate of which sugars",
                                    "nutrientTypeCode": "SUGAR-",
                                    "quantityContained": "0.5",
                                    "quantityContainedUOM": "gram",
                                    "servingInstance": "per 100ml",
                                    "upstreamQuantityContained": "0.5"
                                },
                                {
                                    "dailyValueIntakePercent": "1",
                                    "measurementPrecisionCode": "APPROXIMATELY",
                                    "nutrientDescription": "Carbohydrate of which sugars",
                                    "nutrientTypeCode": "SUGAR-",
                                    "quantityContained": "0.6",
                                    "quantityContainedUOM": "gram",
                                    "servingInstance": "per serving",
                                    "upstreamDailyValueIntakePercent": "1",
                                    "upstreamQuantityContained": "0.6"
                                },
                                {
                                    "measurementPrecisionCode": "APPROXIMATELY",
                                    "nutrientDescription": "Energy",
                                    "nutrientTypeCode": "ENER-KJ",
                                    "quantityContained": "82",
                                    "quantityContainedUOM": "kilojoule",
                                    "servingInstance": "per 100ml",
                                    "upstreamQuantityContained": "82"
                                },
                                {
                                    "dailyValueIntakePercent": "2",
                                    "measurementPrecisionCode": "APPROXIMATELY",
                                    "nutrientDescription": "Energy",
                                    "nutrientTypeCode": "ENER-KJ",
                                    "quantityContained": "185",
                                    "quantityContainedUOM": "kilojoule",
                                    "servingInstance": "per serving",
                                    "upstreamDailyValueIntakePercent": "2",
                                    "upstreamQuantityContained": "185"
                                },
                                {
                                    "measurementPrecisionCode": "LESS_THAN",
                                    "nutrientDescription": "Fibre",
                                    "nutrientTypeCode": "FIBTG",
                                    "quantityContained": "0.5",
                                    "quantityContainedUOM": "gram",
                                    "servingInstance": "per serving",
                                    "upstreamQuantityContained": "0.5"
                                },
                                {
                                    "measurementPrecisionCode": "LESS_THAN",
                                    "nutrientDescription": "Fibre",
                                    "nutrientTypeCode": "FIBTG",
                                    "quantityContained": "0.5",
                                    "quantityContainedUOM": "gram",
                                    "servingInstance": "per 100ml",
                                    "upstreamQuantityContained": "0.5"
                                },
                                {
                                    "dailyValueIntakePercent": "1",
                                    "measurementPrecisionCode": "APPROXIMATELY",
                                    "nutrientDescription": "Fat of Which Saturates",
                                    "nutrientTypeCode": "FASAT",
                                    "quantityContained": "0.2",
                                    "quantityContainedUOM": "gram",
                                    "servingInstance": "per serving",
                                    "upstreamDailyValueIntakePercent": "1",
                                    "upstreamQuantityContained": "0.2"
                                },
                                {
                                    "measurementPrecisionCode": "LESS_THAN",
                                    "nutrientDescription": "Fat of Which Saturates",
                                    "nutrientTypeCode": "FASAT",
                                    "quantityContained": "0.1",
                                    "quantityContainedUOM": "gram",
                                    "servingInstance": "per 100ml",
                                    "upstreamQuantityContained": "0.1"
                                },
                                {
                                    "measurementPrecision": "APPROXIMATELY",
                                    "measurementPrecisionCode": "APPROXIMATELY",
                                    "nutrientDescription": "Salt Per 100ml",
                                    "nutrientTypeCode": "SALTEQ",
                                    "quantityContained": "0.53",
                                    "quantityContainedUOM": "gram",
                                    "servingInstance": "per 100ml",
                                    "upstreamQuantityContained": "0.55"
                                },
                                {
                                    "dailyValueIntakePercent": "20",
                                    "measurementPrecision": "APPROXIMATELY",
                                    "measurementPrecisionCode": "APPROXIMATELY",
                                    "nutrientDescription": "Salt Amount Per Portion",
                                    "nutrientTypeCode": "SALTEQ",
                                    "quantityContained": "1.2",
                                    "quantityContainedUOM": "gram",
                                    "servingInstance": "per serving",
                                    "upstreamDailyValueIntakePercent": "20",
                                    "upstreamQuantityContained": "1.2"
                                },
                                {
                                    "measurementPrecisionCode": "LESS_THAN",
                                    "nutrientDescription": "Fat",
                                    "nutrientTypeCode": "FAT",
                                    "quantityContained": "0.5",
                                    "quantityContainedUOM": "gram",
                                    "servingInstance": "per 100ml",
                                    "upstreamQuantityContained": "0.5"
                                },
                                {
                                    "dailyValueIntakePercent": "1",
                                    "measurementPrecisionCode": "APPROXIMATELY",
                                    "nutrientDescription": "Fat",
                                    "nutrientTypeCode": "FAT",
                                    "quantityContained": "0.7",
                                    "quantityContainedUOM": "gram",
                                    "servingInstance": "per serving",
                                    "upstreamDailyValueIntakePercent": "1",
                                    "upstreamQuantityContained": "0.7"
                                },
                                {
                                    "dailyValueIntakePercent": "2",
                                    "measurementPrecisionCode": "APPROXIMATELY",
                                    "nutrientDescription": "Energy",
                                    "nutrientTypeCode": "ENER-",
                                    "quantityContained": "45",
                                    "quantityContainedUOM": "kilocalorie",
                                    "servingInstance": "per serving",
                                    "upstreamDailyValueIntakePercent": "2",
                                    "upstreamQuantityContained": "45"
                                },
                                {
                                    "measurementPrecisionCode": "APPROXIMATELY",
                                    "nutrientDescription": "Energy",
                                    "nutrientTypeCode": "ENER-",
                                    "quantityContained": "20",
                                    "quantityContainedUOM": "kilocalorie",
                                    "servingInstance": "per 100ml",
                                    "upstreamQuantityContained": "20"
                                },
                                {
                                    "measurementPrecisionCode": "APPROXIMATELY",
                                    "nutrientDescription": "Protein",
                                    "nutrientTypeCode": "PRO-",
                                    "quantityContained": "0.8",
                                    "quantityContainedUOM": "gram",
                                    "servingInstance": "per 100ml",
                                    "upstreamQuantityContained": "0.8"
                                },
                                {
                                    "dailyValueIntakePercent": "4",
                                    "measurementPrecisionCode": "APPROXIMATELY",
                                    "nutrientDescription": "Protein",
                                    "nutrientTypeCode": "PRO-",
                                    "quantityContained": "1.8",
                                    "quantityContainedUOM": "gram",
                                    "servingInstance": "per serving",
                                    "upstreamDailyValueIntakePercent": "4",
                                    "upstreamQuantityContained": "1.8"
                                },
                                {
                                    "dailyValueIntakePercent": "2",
                                    "measurementPrecision": "APPROXIMATELY",
                                    "measurementPrecisionCode": "APPROXIMATELY",
                                    "nutrientDescription": "Calories Amount Per Portion",
                                    "nutrientTypeCode": "ENER-COMBINED",
                                    "quantityContained": "45",
                                    "servingInstance": "per serving",
                                    "upstreamDailyValueIntakePercent": "2",
                                    "upstreamQuantityContained": "45 $$kilocalorie$$ / 185 $$kilojoule$$"
                                },
                                {
                                    "measurementPrecision": "APPROXIMATELY",
                                    "measurementPrecisionCode": "APPROXIMATELY",
                                    "nutrientDescription": "Calories Per 100ml",
                                    "nutrientTypeCode": "ENER-COMBINED",
                                    "quantityContained": "20",
                                    "servingInstance": "per 100ml",
                                    "upstreamQuantityContained": "20 $$kilocalorie$$ / 82 $$kilojoule$$"
                                },
                                {
                                    "measurementPrecision": "APPROXIMATELY",
                                    "nutrientDescription": "Total Carbohydrate Per 100ml",
                                    "nutrientTypeCode": "CHOCAVL",
                                    "quantityContained": "3.3",
                                    "servingInstance": "per 100ml"
                                }
                            ],
                            "preparationStateUsed": "Prepared",
                            "upstreamNumberOfServingsPerPackage": "4"
                        },
                        "pimId": "087125662479055000228000016GB",
                        "pimModifiedDate": "2026-05-29T11:23:27",
                        "productDescription": "Knorr Soup Sach ChickenNoodle 12x51g",
                        "productFeatureBenefit": [
                            {
                                "featureAndBenefit": "Knorr Super Chicken Noodle Soup Mix is a tasty and versatile soup that is fast to prepare in just 5 minutes"
                            },
                            {
                                "featureAndBenefit": "Great taste is in our nature, and this packet soup has been created with chicken and oodles of noodles"
                            },
                            {
                                "featureAndBenefit": "Simply bring 900 ml of water to the boil, add the contents of the sachet, stir and simmer, then enjoy this delicious, warming soup"
                            },
                            {
                                "featureAndBenefit": "Knorr Super Chicken Noodle Soup Mix is free from artificial colours and preservatives"
                            },
                            {
                                "featureAndBenefit": "Knorr is in partnership with sustainable agriculture meaning a great taste and high-quality ingredients that go into our stocks, gravies, soups and seasonings"
                            },
                            {
                                "featureAndBenefit": "For a heartier soup, add your favourite veggies"
                            }
                        ],
                        "productFormDescription": "Treat your taste buds with Knorr Super Chicken Noodle Soup Mix. Our Knorr chefs have created this delicious soup with a selection of our finest ingredients. Staples of the kitchen cupboard, our Packet Soups are as tasty as they are versatile. Perfect for lunch, dinner, or whenever you feel like a simple, tasty treat in a bowl. Knorr Super Chicken Noodle Soup Mix is free from artificial colours and preservatives, making it an excellent choice for creating a family-favourite meal. This packet soup is a real crowd-pleaser with children and grown-ups alike.\n\nPreparation Method:\n1. Bring 900 ml of water to the boil. Empty the soup packet contents into the boiling water. Stir well with a whisk or fork.\n2. Reduce heat and simmer for five minutes, stirring occasionally.\n3. Serve & enjoy!\n\n If you like Knorr Super Chicken Noodle Soup Mix, try one of our other soups such as Chicken and Leek or Florida Spring Vegetable. \n\nAt Knorr, we source high-quality ingredients to create delicious stocks, gravies, soups, and seasonings enjoyed by families across the world. Our Knorr chefs believe that great-tasting and high-quality ingredients come from a conscious use of agricultural resources. Great Taste is in our Nature! To learn more, please visit our website.",
                        "productImages": [
                            "https://assets.unileversolutions.com/v2/w600/ch-retailer/web/PvmNq0RpRKquXxVSQqz7TA/144540565.jpeg",
                            "https://assets.unileversolutions.com/v2/w600/ch-retailer/web/z_CUE7_DQZO4ZEBhlm_m_A/144540562.jpeg"
                        ],
                        "productName": "Knorr Super Chicken Noodle Dry Packet Soup 4 Servings free from artificial colours and preservatives quick and easy 4x 51 g",
                        "productType": "BASE_UNIT_OR_EACH",
                        "ratingCount": 51,
                        "regulatedProductName": "Chicken Noodle Soup Mix.",
                        "retailerCodes": [
                            "Brandbank",
                            "Amazon Pantry",
                            "Asda",
                            "Ocado",
                            "Sainsburys",
                            "Tesco",
                            "Morrisons",
                            "FreshAmazon",
                            "Coop",
                            "Amazon_eComm",
                            "Amazon Fresh"
                        ],
                        "reviewCount": 51,
                        "sku": "8712566247905",
                        "subcategory": "Soups",
                        "upstreamImages": "144540565 (Front)\n144540562 (Back)",
                        "upstreamIngredientStatement": "Pasta (64%) (durum WHEAT semolina, WHEAT flour), flavourings (contain CELERY), iodised salt, chicken (4.6%) [chicken, vegetable oil (palm), salt, antioxidants (ascorbyl palmitate, alpha-tocopherol)], starch, yeast extract, chicken fat (2.5%) [chicken fat, antioxidant (extracts of rosemary)], toasted onion powder (2%), potassium chloride, sugar, salt, spices (CELERY seeds, turmeric, pepper), parsley. May contain egg, milk, mustard, soy and other cereals containing gluten."
                    },
                    "productStatus": "UPDATE",
                    "retailerNutritionUsed": "true",
                    "retailerProductData": {
                        "retailer1VOTEcommerceTitle": "Chicken Noodle Soup",
                        "retailerAboutThisProductBullets": "<h2>Free From</h2>\n<ul><li>No added MSG</li>\n<li>Free from artificial colours</li>\n<li>Free from artificial preservatives</li></ul>",
                        "retailerAboutThisProductDescription": "Enjoy oodles of noodles and the taste of succulent chicken in this delicious warming Knorr Chicken Noodle soup - a real crowd-pleaser with children and grown-ups alike. Perfect at lunch, dinner or whenever you feel like a simple, tasty treat in a bowl- and guess what? It is all cooked and ready to eat in just five minutes!",
                        "retailerAltTextImages": "Chicken Noodle Soup",
                        "retailerBrand": "Knorr",
                        "retailerCategory": "About our Chicken Noodle Soup",
                        "retailerEAN": "8712566247905",
                        "retailerGlobalBrandCode": "BF0426",
                        "retailerGrouping": "products/soup",
                        "retailerHowToUseDescription": "<h3>For 1.5 pints:</h3>\n<ol><li><p>Empty contents of the sachet into saucepan.</p></li>\n<li><p>Gradually add 850ml of cold water, stirring constantly.</p></li>\n<li><p>Bring to the boil and reduce the heat, partially cover and simmer for 5 minutes, stirring occasionally.</p></li>\n<li><p>Serve and enjoy!</p></li></ol>\n\n<h3>For 2.5 pints:</h3>\n<ol><li><p>Empty contents of the sachet into saucepan.</p></li>\n<li><p>Gradually add 1.5 litres of cold water, stirring constantly.</p></li>\n<li><p>Bring to the boil and reduce the heat, partially cover and simmer for 5 minutes, stirring occasionally.</p></li>\n<li><p>Serve and enjoy!</p></li></ol>",
                        "retailerImageType": "Tall",
                        "retailerLongProductDescription": "Tasty and flavourful",
                        "retailerMetaDescription": "Enjoy oodles of noodles and the taste of succulent chicken in this delicious Knorr soup –  the perfect choice for a simple, tasty treat in a bowl.",
                        "retailerMetaTitle": "Chicken Noodle Soup",
                        "retailerNutritionFactsCaloriesAmountPerPortion": "45",
                        "retailerNutritionFactsCaloriesPer100ml": "20",
                        "retailerNutritionFactsSaltAmountPerPortion": "1.2",
                        "retailerNutritionFactsSaltPer100ml": "0.53",
                        "retailerNutritionFactsSaltPercentagePerPortion": "20",
                        "retailerNutritionFactsServingSize": "225",
                        "retailerNutritionFactsTotalCarbohydratePer100ml": "3.3",
                        "retailerProductDescription": "Enjoy oodles of noodles and the taste of succulent chicken in this delicious warming soup - a real crowd-pleaser with children and grown-ups alike. Perfect at lunch, dinner or whenever you feel like a simple, tasty treat in a bowl.",
                        "retailerProductTags": [
                            "unilever:knorrv2/product/type/soup"
                        ],
                        "retailerSmartLabelId": "32",
                        "retailerSmartProductId": "4859d7ce9e41c8370824b288016feb15",
                        "retailerVariantsSummary": [
                            {
                                "description": "Enjoy oodles of noodles and the taste of succulent chicken in this delicious warming soup - a real crowd-pleaser with children and grown-ups alike. Perfect at lunch, dinner or whenever you feel like a simple, tasty treat in a bowl.",
                                "gtin": "08712566247905",
                                "name": "Chicken Noodle Soup",
                                "retailerEANUPC": "8712566247905",
                                "retailerSize": "4x 51 g",
                                "retailerSmartProductId": "4859d7ce9e41c8370824b288016feb15"
                            }
                        ],
                        "startAvailabilityDate": "2014-01-01T00:00:00"
                    },
                    "searchableCategory": "About our Chicken Noodle Soup",
                    "searchableSubCategory": "Soups",
                    "sortingName": "CHICKEN NOODLE SOUP",
                    "sources": [
                        "gapi",
                        "kritique",
                        "recommender",
                        "sustainability",
                        "xls"
                    ],
                    "updated_at": "2026-05-01T16:04:49.066071+00:00",
                    "utcLastModifiedDate": "2026-05-29 23:46:52",
                    "utcMergedDate": "2026-05-29 23:46:52",
                    "utcStartAvailabilityDate": "2014-01-01T00:00:00Z",
                    "warnings": [
                        "PIM Sheet nutrition was used as some were not provided upstream. Nutrition must be added to PLM/PIM2C."
                    ]
                },
                "sort": [
                    4.2,
                    "08712566247905"
                ]
            }
        ]
    }
}
  };
}
