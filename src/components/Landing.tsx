"use client";
import { useTheme } from "@/app/hooks/useTheme";
import colors from "@/app/color/color";
import { useAuth } from "@/app/hooks/useAuth";

export default function LandingPage() {
  const { theme } = useTheme();
  const { user: auth } = useAuth();
  return (
    <div
      className={`px-[10%] mt-[20%] sm:mt-[10%] sm:px-[10%] mb-[5%] pb-[5%] w-full ${
        theme ? "bg-[#ffffff] text-[#aaaaaaa]" : "bg-[#000000] text-[#eeeeee]"
      }`}
    > {auth ? auth.name : "no auth "}
       Lorem ipsum dolor sit amet consectetur adipisicing elit. Itaque
      repudiandae dignissimos, quibusdam voluptatem odio at veritatis magni
      adipisci harum sequi non facere, aliquid possimus reprehenderit nam
      consequatur officia totam nostrum modi laboriosam, perferendis nulla sint!
      Dicta dolor culpa dolore exercitationem tempore et quas architecto? Sunt
      quasi itaque sequi laborum. Repudiandae, quas! Quos animi nesciunt,
      necessitatibus sunt ipsum excepturi molestias fugiat minima sequi fugit
      velit nemo ex eius atque eveniet suscipit in error nisi! Necessitatibus
      officia enim obcaecati, ullam magnam nobis veniam facilis libero quia
      repellat atque saepe perferendis temporibus, nostrum illo optio, officiis
      maxime quas fugiat ratione est! Itaque id nisi totam ratione ex iusto,
      dolor quos voluptas culpa eveniet maxime facilis sint tempore quis, fugit
      a cupiditate facere accusantium voluptatibus. Nemo provident, ex deserunt
      saepe iure blanditiis nostrum iste animi? Voluptas est laboriosam,
      cupiditate, exercitationem voluptatibus error id fugit quas recusandae non
      optio, quae tempore deserunt sit explicabo soluta incidunt ut excepturi
      accusantium libero. Cumque consequatur nemo pariatur neque itaque nihil
      quod quis libero ad quo, quaerat numquam sint et reprehenderit earum
      similique iste incidunt est ullam quas harum. Nam dolore debitis, voluptas
      temporibus asperiores maiores molestias eius, similique et deserunt
      delectus consequuntur ducimus quidem dicta iusto accusantium ab error quas
      autem! Corrupti, exercitationem. Ut quam similique, quod assumenda
      laboriosam voluptatibus molestiae nam pariatur, numquam provident
      laudantium esse quia modi reprehenderit. Ab voluptate voluptatibus
      corporis consequatur. Itaque libero enim pariatur laboriosam tempore
      suscipit, inventore, ullam excepturi in velit recusandae quo reiciendis
      sequi non incidunt temporibus soluta commodi esse voluptatum ipsa, iure
      tempora culpa similique ex. Recusandae assumenda placeat ullam
      consequuntur nihil debitis in at atque fugit a deserunt nostrum
      exercitationem pariatur, accusantium amet impedit voluptates quam sunt
      alias qui ad dolorum officiis doloremque. Non eum dolor fuga temporibus
      pariatur. Quo beatae consequatur harum et fuga sed rerum corporis dolores
      perspiciatis nisi fugiat nihil, est autem, facere debitis necessitatibus
      laboriosam laborum veniam minima veritatis error unde saepe hic?
      Reprehenderit dolores ad quod voluptatem assumenda vel asperiores!
      Distinctio dicta earum molestias. Hic, aliquid assumenda dicta possimus
      quam sed id praesentium consectetur quae, similique doloremque ab, tempora
      optio officia officiis neque quidem repudiandae atque! Ex voluptates
      numquam reprehenderit possimus harum corporis illum est! Consequatur ipsum
      dolor explicabo, fugit quos eius possimus autem impedit mollitia nemo
      quibusdam veritatis nesciunt. Porro ullam autem quisquam facilis adipisci
      accusamus quod quia suscipit, saepe molestias, expedita voluptate quaerat
      illum beatae libero illo deserunt deleniti ipsa. Consectetur saepe cum
      quos ullam cupiditate possimus laborum nesciunt libero? Numquam quaerat,
      tempora, eaque quo ipsa quasi, magnam nam necessitatibus culpa ipsam
      officia deleniti sapiente obcaecati? Porro omnis hic nisi sed fugit eius
      inventore! Ipsa beatae dolores iste ipsam doloribus commodi atque
      quibusdam, animi sint aut dicta fugit possimus rem consequuntur. Impedit
      ipsam ipsum consequatur corrupti adipisci. Itaque, eaque. Nam consectetur
      eos ad aliquid deserunt. Nesciunt totam eum dolore illo, officia quisquam
      vitae sapiente recusandae doloremque autem sequi earum ipsa perspiciatis,
      velit unde excepturi eveniet sed deleniti ducimus nobis mollitia
      reprehenderit. Doloribus, asperiores. Sit exercitationem dolores similique
      repudiandae inventore laborum assumenda nobis modi suscipit repellendus
      esse ea asperiores cum est sed recusandae, voluptatibus expedita. Pariatur
      qui nesciunt suscipit quisquam enim magnam ipsam eligendi consequuntur,
      asperiores, itaque a aliquid aperiam. Minus dolorem dolores quibusdam nam
      eaque dicta mollitia voluptatum at corporis hic repellendus quod sit
      alias, tempore libero? Odit hic rem obcaecati vel molestias consectetur
      alias soluta, minus aliquam quam tempora. Tempore itaque vel totam
      veritatis voluptatum libero veniam? Magni dignissimos excepturi veniam
      ullam eum accusantium perspiciatis saepe, dolorum dicta. Excepturi
      voluptatum doloribus sit architecto vel sapiente illo! Veritatis aperiam
      doloribus sunt, dolore odio repellat, quisquam voluptates quibusdam aut
      labore laudantium dolorum quod eveniet culpa placeat exercitationem
      ducimus optio odit, quos quis neque! Sint dicta consectetur nihil eveniet
      minus aliquam iure eaque fugit quo, quam harum nobis repellendus incidunt
      recusandae maiores a maxime culpa non laboriosam excepturi deserunt
      labore. Et facilis obcaecati quod? Sint laborum id consectetur saepe ullam
      officia libero cumque molestiae fugit explicabo, similique suscipit dolor
      culpa, repudiandae eligendi reiciendis velit distinctio excepturi error
      aut neque porro sunt voluptatem natus. Alias, hic. Tempore natus, incidunt
      doloremque libero illo ad nihil. Obcaecati dignissimos incidunt
      voluptatem, quis ullam nam! Illo accusantium voluptates harum ducimus
      voluptatibus quaerat rerum hic quo. Temporibus, iusto. Distinctio corporis
      explicabo aperiam, laborum excepturi quaerat ea dolore ex? Cupiditate
      officia reiciendis molestiae necessitatibus perspiciatis numquam voluptas.
      Ea repellat omnis sit mollitia aperiam, rerum officia molestiae ipsa,
      veritatis cupiditate ipsam rem nihil. Doloremque quibusdam nam perferendis
      perspiciatis provident sequi quidem porro ipsa exercitationem nemo
      accusantium sunt similique quae voluptas blanditiis quia aspernatur
      explicabo odit id cumque, veniam quis. Saepe vel magnam veniam asperiores
      reiciendis, aut est eveniet dolorem nobis. Quos quidem pariatur animi
      architecto quisquam reprehenderit unde nam at distinctio, amet aliquid
      dolorum minus nisi fuga incidunt veritatis necessitatibus excepturi
      placeat illum perferendis recusandae consequatur earum? Obcaecati animi
      aliquid aspernatur natus nihil hic quia mollitia rem corrupti voluptatibus
      non voluptatem quidem facere dolorem impedit laboriosam quaerat magnam
      beatae tempore ea fugiat, aliquam ut iste. Est tenetur quis molestias
      dolores doloremque nulla minus ex, repellendus ut eligendi odit tempora
      dicta perspiciatis facere consequatur fugit eaque sit expedita, ducimus
      nihil doloribus consectetur neque. Consectetur, error blanditiis
      voluptatum eius, doloribus doloremque veniam eum iure harum, iste ipsam
      inventore aliquam. Numquam, commodi cupiditate dolores soluta assumenda,
      illum, voluptate dolor facilis reiciendis modi quam debitis ipsam velit
      incidunt eveniet placeat excepturi provident. Dolores modi, dolor saepe
      quaerat consequatur necessitatibus! Voluptates inventore obcaecati
      laudantium itaque quam sint libero autem necessitatibus tenetur! Animi aut
      ratione, perspiciatis dolor quo, corporis enim et placeat vel quia
      dolorum? Possimus mollitia vel aut saepe totam soluta odio commodi unde
      facere laborum eligendi, molestiae sunt hic reprehenderit repudiandae,
      libero ipsa cumque necessitatibus harum deserunt eveniet. Voluptatem enim
      unde quis voluptatibus temporibus dignissimos dolorum, odio commodi
      asperiores quaerat impedit atque, neque facere. Eum aperiam nesciunt
      pariatur ab sunt, magnam, ullam voluptatum quisquam, iure dolor
      reprehenderit veritatis amet nulla inventore sequi fugiat! Sequi minima
      dolorum voluptates! Sed enim nihil impedit natus recusandae commodi
      obcaecati aspernatur minima ipsa! Consequuntur cum suscipit sint aut minus
      temporibus fuga?
    </div>
  );
}
