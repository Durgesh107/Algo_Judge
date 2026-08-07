import { Resolver, Query } from "type-graphql";


@Resolver()
export class HelloResolver{
    @Query(()=>String)
    hello1(){
        return "hello";
    }
}