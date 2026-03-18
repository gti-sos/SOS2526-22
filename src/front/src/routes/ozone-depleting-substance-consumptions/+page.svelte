<script>
    // @ts-ignore
    let ozono= $state([]);
    import {dev} from "$app/environment"

    let API= '/api/v1/ozone-depleting-substance-consumptions';

    if(dev)
        API = 'http://localhost:3000' + API;

    async function getOzono() {
        const res=await fetch(API,{
            method : "GET"
        });

        const data = await res.json();
        ozono = data;
    
    
}

</script>

<p>ozone-depleting-substance-consumptions</p>

<ul>
{#each ozono as item (item.country)}
    <li>{item.country} - {item.year} - {item.methyl_chloroform} - {item.methyl_bromide} - {item.hcfc} - {item.carbon_tetrachloride} - {item.halon} - {item.cfc}</li>
{/each}
</ul>
<button onclick={getOzono}>Refresh</button>
