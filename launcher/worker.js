'use strict'
const fs = require('fs')
const Utils = require('../common/utils')
const cheerio = require('cheerio')

class MappingGuideTJBA {

    get atribuicoes() { return '[id="atribuicoes"]' }
    get tipoatos() { return '[id="tiposatos"]' }
    get comarcas() { return '[id="comarcas"]' }
    get cartorios() { return '[id="cartorios"]' }

    get buttonNumProcesso() { return '[id="buttonNumProcesso"]' }


    async execute(jobData) {
        await Utils.pageIsComplete();
        const atribuicoes = await browser.$('#atribuicoes').getHTML()
        let $ = cheerio.load(atribuicoes)
        const atribuicoesOptions = $('option').get().map(opt => { return { text: $(opt).text(), value: $(opt).val(), children: [] } })
        atribuicoesOptions.shift()
        for (const atribOption of atribuicoesOptions) {
            if (!atribOption.value) continue
            const atribText = atribOption.text;
            const atribValue = atribOption.value

            await Utils.selectByValue('#atribuicoes', atribValue)
            await Utils.pageIsComplete();
            await Utils.isLoading('img[src*="loading.gif"]')
            
            if (!(await Utils.waitForExisting('#tiposatos'))) continue
            const tiposAtosSelect = await browser.$('#tiposatos').getHTML()
            $ = cheerio.load(tiposAtosSelect)
            const tiposAtosOptions = $('option').get().map(opt => { return { text: $(opt).text(), value: $(opt).val(), children: [] } })
            
            for (const tipoOption of tiposAtosOptions) {
                if (!tipoOption.value) continue
                if(fs.existsSync(__dirname + `/${atribText} - ${tipoOption.value}.json`)) continue
                const comarcas = [];
                const tiposAtos = [{
                    text: tipoOption.text,
                    value: tipoOption.value,
                    children: []
                }]

                await Utils.selectByValue('#tiposatos', tipoOption.value)
                await Utils.pageIsComplete();
                await Utils.isLoading('img[src*="loading.gif"]')

                await this.findComarca()
                const comarcaSelect = await browser.$('#comarcas').getHTML()
                $ = cheerio.load(comarcaSelect)
                const comarcaOptions = $('option').get().map(opt => { return { text: $(opt).text(), value: $(opt).val(), children: [] } })

                for (const comarcaOption of comarcaOptions) {
                    if (!comarcaOption.value) continue
                    const comarcaText = comarcaOption.text;
                    const comarcaValue = comarcaOption.value;
                    await Utils.selectByValue('#comarcas', comarcaValue)
                    await Utils.pageIsComplete();
                    await Utils.isLoading('img[src*="loading.gif"]')

                    if (!(await Utils.waitForExisting('#cartorios'))) continue
                    const cartorioSelect = await browser.$('#cartorios').getHTML()
                    $ = cheerio.load(cartorioSelect)
                    const cartorios = $('option').get().map(opt => { return { text: $(opt).text(), value: $(opt).val(), children: [] } })

                    comarcas.push({
                        text: comarcaText,
                        value: comarcaValue,
                        children: cartorios
                    });
                }
                console.log(`\n ${__dirname}/${atribText} - ${tiposAtos[0].value}.json`);
                require('fs').writeFileSync(__dirname + `/${atribText} - ${tiposAtos[0].value}.json`, JSON.stringify({
                    text: atribText,
                    value: atribValue,
                    comarca: comarcas,
                    children: tiposAtos
                }, null, 2))
            }
        }

    }


    async findComarca() {
        await browser.pause(2000)
        await Utils.pageIsComplete()
        if ((await Utils.waitForExisting(this.comarcas))) return

        await Utils.clickField('#processo')
        await browser.pause(2000)
        await Utils.pageIsComplete()
        if ((await Utils.waitForExisting(this.comarcas))) return

        if (!(await Utils.checkExisting('#numProcesso'))) return await this.findComarca()
        await Utils.setFieldValueTyping('#numProcesso', '80941268720208050001')
        await Utils.clickField(this.buttonNumProcesso)
        await browser.pause(3000)
        await Utils.pageIsComplete()

        if (!(await Utils.waitForExisting(this.comarcas))) return await this.findComarca()
    }

    async waitForExist(elementID) {
        try {
            return await elementID.waitForExist({ timeout: 20000 })
        } catch (error) {
            return false
        }
    }
}
module.exports = MappingGuideTJBA
